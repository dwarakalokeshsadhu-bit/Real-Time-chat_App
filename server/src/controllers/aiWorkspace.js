import Channel from '../models/Channel.js';
import AIMemory from '../models/AIMemory.js';
import AITask from '../models/AITask.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { answerFromMemories, findRelevantMemories } from '../services/workspaceAI.js';

async function assertChannelMember(channelId, username) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');
  if (!channel.members.includes(username)) throw new ApiError(403, 'Private channel');
  return channel;
}

export const getMemories = asyncHandler(async (req, res) => {
  await assertChannelMember(req.params.channelId, req.user.username);

  const memories = await AIMemory.find({ channelId: req.params.channelId })
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({ success: true, memories });
});

export const askMemory = asyncHandler(async (req, res) => {
  await assertChannelMember(req.params.channelId, req.user.username);

  const query = String(req.body.query || '').trim();
  if (!query) throw new ApiError(400, 'Question is required');

  const memories = await findRelevantMemories(req.params.channelId, query);
  res.json({
    success: true,
    answer: answerFromMemories(query, memories),
    memories
  });
});

export const getTasks = asyncHandler(async (req, res) => {
  await assertChannelMember(req.params.channelId, req.user.username);

  const tasks = await AITask.find({ channelId: req.params.channelId })
    .sort({ status: 1, dueDate: 1, createdAt: -1 })
    .limit(50);

  res.json({ success: true, tasks });
});

export const updateTask = asyncHandler(async (req, res) => {
  await assertChannelMember(req.params.channelId, req.user.username);

  const task = await AITask.findOneAndUpdate(
    { _id: req.params.taskId, channelId: req.params.channelId },
    { status: req.body.status === 'done' ? 'done' : 'open' },
    { new: true }
  );

  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, task });
});

export const getSummary = asyncHandler(async (req, res) => {
  await assertChannelMember(req.params.channelId, req.user.username);

  const memories = await AIMemory.find({ channelId: req.params.channelId })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const decisions = memories.filter(memory => memory.type === 'decision').slice(0, 3);
  const blockers = memories.filter(memory => memory.type === 'blocker').slice(0, 3);
  const questions = memories.filter(memory => memory.type === 'question').slice(0, 3);
  const notes = memories.filter(memory => !['decision', 'blocker', 'question'].includes(memory.type)).slice(0, 3);

  res.json({
    success: true,
    summary: {
      decisions,
      blockers,
      questions,
      notes
    }
  });
});
