import AIMemory from '../models/AIMemory.js';
import AITask from '../models/AITask.js';
import { env } from '../config/env.js';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'will', 'have', 'has',
  'are', 'was', 'were', 'our', 'you', 'your', 'they', 'them', 'but', 'not'
]);

const normalize = value => String(value || '').trim();

function extractKeywords(text) {
  return [...new Set(
    normalize(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word))
  )].slice(0, 12);
}

function classifyMemory(content) {
  const text = content.toLowerCase();
  if (/(decided|finalized|agreed|we will use|we chose|approved|selected)/.test(text)) return 'decision';
  if (/(blocked|blocker|stuck|issue|problem|cannot|can't|failing)/.test(text)) return 'blocker';
  if (/(fixed|solution|resolved|answer is|use this|worked by)/.test(text)) return 'solution';
  if (content.includes('?')) return 'question';
  return 'note';
}

function makeTitle(content, type) {
  const cleaned = normalize(content).replace(/\s+/g, ' ');
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return `${label}: ${cleaned.slice(0, 72)}${cleaned.length > 72 ? '...' : ''}`;
}

function parseDueDate(dueText) {
  const text = normalize(dueText).toLowerCase();
  if (!text) return null;

  const now = new Date();
  if (text.includes('today')) return now;
  if (text.includes('tomorrow')) return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekday = weekdays.findIndex(day => text.includes(day));
  if (weekday >= 0) {
    const result = new Date(now);
    const delta = (weekday - result.getDay() + 7) % 7 || 7;
    result.setDate(result.getDate() + delta);
    return result;
  }

  const parsed = Date.parse(dueText);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function extractTask(content) {
  const text = normalize(content).replace(/\s+/g, ' ');
  const patterns = [
    /(?:^|\s)([A-Z][A-Za-z0-9_-]{1,30})\s+will\s+(.+?)\s+by\s+(.+?)(?:[.!?]|$)/i,
    /(?:assign|assigned to)\s+([A-Z][A-Za-z0-9_-]{1,30})\s*[:-]?\s*(.+?)\s+by\s+(.+?)(?:[.!?]|$)/i,
    /(?:todo|task)\s*[:-]\s*(.+?)\s+by\s+(.+?)(?:[.!?]|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    if (pattern.source.includes('todo|task')) {
      return {
        title: match[1].trim(),
        assignee: '',
        dueText: match[2].trim(),
        confidence: 0.68
      };
    }

    return {
      assignee: match[1].trim(),
      title: match[2].trim(),
      dueText: match[3].trim(),
      confidence: 0.78
    };
  }

  return null;
}

async function createEmbedding(text) {
  if (!env.OPENAI_API_KEY) return undefined;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) return undefined;
    const data = await response.json();
    return data.data?.[0]?.embedding;
  } catch (err) {
    console.error('[workspace-ai] embedding failed', err.message);
    return undefined;
  }
}

function cosineSimilarity(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export async function processWorkspaceMessage({ channelId, message }) {
  const content = normalize(message?.content);
  if (!channelId || content.length < 8) return;

  const type = classifyMemory(content);
  const keywords = extractKeywords(content);
  const embedding = await createEmbedding(content);

  await AIMemory.create({
    channelId,
    messageId: message._id,
    author: message.senderId,
    type,
    title: makeTitle(content, type),
    content,
    keywords,
    embedding
  });

  const task = extractTask(content);
  if (task) {
    await AITask.create({
      channelId,
      messageId: message._id,
      title: task.title,
      assignee: task.assignee,
      dueText: task.dueText,
      dueDate: parseDueDate(task.dueText),
      sourceText: content,
      confidence: task.confidence
    });
  }
}

export async function findRelevantMemories(channelId, query, limit = 6) {
  const cleanedQuery = normalize(query);
  if (!cleanedQuery) return [];

  const queryEmbedding = await createEmbedding(cleanedQuery);
  const memories = await AIMemory.find({ channelId })
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();

  if (queryEmbedding) {
    return memories
      .map(memory => ({
        ...memory,
        score: cosineSimilarity(queryEmbedding, memory.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  const queryWords = extractKeywords(cleanedQuery);
  return memories
    .map(memory => {
      const haystack = `${memory.title} ${memory.content} ${(memory.keywords || []).join(' ')}`.toLowerCase();
      const score = queryWords.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
      return { ...memory, score };
    })
    .filter(memory => memory.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function answerFromMemories(query, memories) {
  if (!memories.length) {
    return `I could not find a saved memory for "${query}" in this channel yet.`;
  }

  const top = memories[0];
  const supporting = memories.slice(1, 3).map(memory => memory.title).join('; ');
  return supporting
    ? `${top.content}\n\nRelated context: ${supporting}`
    : top.content;
}
