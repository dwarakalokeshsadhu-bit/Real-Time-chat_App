import React, { useEffect, useState } from 'react';
import { api } from '../../api';

export default function AIWorkspacePanel({ channelId }) {
  const [open, setOpen] = useState(false);
  const [memories, setMemories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const loadWorkspace = async () => {
    if (!channelId) return;
    const [memoryRes, taskRes, summaryRes] = await Promise.all([
      api.get(`/ai-workspace/${channelId}/memories`),
      api.get(`/ai-workspace/${channelId}/tasks`),
      api.get(`/ai-workspace/${channelId}/summary`)
    ]);

    setMemories(memoryRes.data.memories || []);
    setTasks(taskRes.data.tasks || []);
    setSummary(summaryRes.data.summary || null);
  };

  useEffect(() => {
    setAnswer('');
    setQuery('');
    if (open) loadWorkspace();
  }, [channelId, open]);

  const ask = async (event) => {
    event.preventDefault();
    if (!query.trim() || !channelId) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/ai-workspace/${channelId}/ask`, { query });
      setAnswer(data.answer || 'No answer found yet.');
      setMemories(data.memories || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
    const nextStatus = task.status === 'done' ? 'open' : 'done';
    const { data } = await api.patch(`/ai-workspace/${channelId}/tasks/${task._id}`, {
      status: nextStatus
    });
    setTasks(current => current.map(item => item._id === data.task._id ? data.task : item));
  };

  if (!channelId) return null;

  const decisionCount = summary?.decisions?.length || 0;
  const blockerCount = summary?.blockers?.length || 0;
  const openTasks = tasks.filter(task => task.status !== 'done');

  return (
    <section className="ai-workspace-panel">
      <button type="button" className="ai-workspace-toggle" onClick={() => setOpen(current => !current)}>
        <span>AI Workspace Memory</span>
        <strong>{openTasks.length} tasks</strong>
      </button>

      {open && (
        <div className="ai-workspace-body">
          <div className="ai-stats">
            <span>{memories.length} memories</span>
            <span>{decisionCount} decisions</span>
            <span>{blockerCount} blockers</span>
          </div>

          <form className="ai-ask-form" onSubmit={ask}>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Ask what the team already discussed..."
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Thinking' : 'Ask'}
            </button>
          </form>

          {answer && (
            <div className="ai-answer">
              <span>Answer</span>
              <p>{answer}</p>
            </div>
          )}

          <div className="ai-panel-grid">
            <div>
              <h3>Auto Tasks</h3>
              {tasks.length ? tasks.slice(0, 6).map(task => (
                <label className={task.status === 'done' ? 'ai-task done' : 'ai-task'} key={task._id}>
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => toggleTask(task)}
                  />
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.assignee ? `${task.assignee}` : 'Unassigned'}
                      {task.dueText ? ` · due ${task.dueText}` : ''}
                    </small>
                  </span>
                </label>
              )) : <p className="ai-empty">No tasks detected yet.</p>}
            </div>

            <div>
              <h3>Recent Memory</h3>
              {memories.length ? memories.slice(0, 6).map(memory => (
                <article className="ai-memory" key={memory._id}>
                  <span>{memory.type}</span>
                  <p>{memory.content}</p>
                </article>
              )) : <p className="ai-empty">No memory saved yet.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
