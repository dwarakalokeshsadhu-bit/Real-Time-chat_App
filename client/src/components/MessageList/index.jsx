import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useMessageStore } from '../../store/messageSlice';
import { useAuthStore } from '../../store/authSlice';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function MessageList({ messages, channelId, setReply }) {

  const fetchMessages = useMessageStore(s => s.fetchMessages);
  const editMessage = useMessageStore(s => s.editMessage);
  const deleteMessage = useMessageStore(s => s.deleteMessage);
  const user = useAuthStore(s => s.user);
  const [openPicker, setOpenPicker] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const bottomRef = useRef();

  // 🔥 auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function react(messageId, emoji) {
    await api.post(`/messages/${channelId}/${messageId}/reactions`, { emoji });
    await fetchMessages(channelId);
    setOpenPicker(null);
  }

  async function saveEdit(messageId) {
    if (!editContent.trim()) return;
    await editMessage(channelId, messageId, editContent);
    setEditingId(null);
    setEditContent("");
  }

  async function remove(messageId) {
    if (!window.confirm("Delete this message?")) return;
    await deleteMessage(channelId, messageId);
  }

  const formatMessageDate = (value) =>
    value
      ? new Date(value).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
      : '';

  const getSenderAvatar = (message) => {
    if (message.senderAvatarUrl) return message.senderAvatarUrl;
    if (message.senderId === user?.username) return user?.avatarUrl || '';
    return '';
  };

  return (
    <div className="messages">

      {messages.map(m => {
        const isMine = m.senderId === user?.username;

        return (
        <div className={isMine ? "message mine" : "message"} key={m._id}>

          <div className="message-card">

            {/* 🔥 Username */}
            <div className="message-user-row">
              <div className="message-avatar">
                {getSenderAvatar(m) ? (
                  <img src={getSenderAvatar(m)} alt={m.senderId || 'User'} />
                ) : (
                  <span>{(m.senderId || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="message-meta">
                <span className="message-user">
                  {m.senderId || 'User'}
                </span>
                <span className="message-date">
                  {formatMessageDate(m.createdAt)}
                </span>
              </div>
            </div>

            {/* 🔥 Reply UI (clean + attached) */}
            {m.replyTo && (
              <div className="reply-box">
                <span className="reply-label">Reply</span>
                <p className="reply-text">{m.replyTo.content}</p>
              </div>
            )}

            {editingId === m._id ? (
              <div className="edit-message-box">
                <textarea
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  autoFocus
                />
                <div className="edit-message-actions">
                  <button onClick={() => saveEdit(m._id)}>Save</button>
                  <button onClick={() => {
                    setEditingId(null);
                    setEditContent("");
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : m.content && (
              <p className="message-text">
                {m.content}
                {m.editedAt && <span className="edited-label"> edited</span>}
              </p>
            )}

            {/* 🔥 File preview */}
           {m.fileUrl && (
  <div className="file-card">

    {m.fileType?.startsWith("audio") ? (
      <div className="voice-message">
        <span>Voice message</span>
        <audio src={m.fileUrl} controls />
      </div>
    ) : m.fileType?.startsWith("image") ? (
      <img src={m.fileUrl} alt="file" className="file-image" />
    ) : (
      <div className="file-info">

        <div className="file-meta">
          <span className="file-icon">📄</span>

          <div>
            <div className="file-name">
              {m.fileUrl.split("/").pop()}
            </div>
          </div>
        </div>

        <a
          href={m.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="download-btn"
        >
          ⬇ Download
        </a>

      </div>
    )}

  </div>
)}

            {/* 🔥 Reactions */}
            <div className="reactions">
              {(m.reactions || []).map((r, i) => (
                <span key={i}>{r.emoji} {r.count}</span>
              ))}
            </div>

            {/* 🔥 Actions */}
            <div className="actions">
              <button onClick={() => setReply(m)}>Reply</button>

              {isMine && m.content && (
                <button onClick={() => {
                  setEditingId(m._id);
                  setEditContent(m.content);
                  setOpenPicker(null);
                }}>
                  Edit
                </button>
              )}

              {isMine && (
                <button className="delete-message-btn" onClick={() => remove(m._id)}>
                  Delete
                </button>
              )}

              <button onClick={() =>
                setOpenPicker(openPicker === m._id ? null : m._id)
              }>
                😊
              </button>
            </div>

            {/* 🔥 Emoji Picker */}
            {openPicker === m._id && (
              <div className="emoji-picker">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji) => react(m._id, emoji.native)}
                />
              </div>
            )}

          </div>

        </div>
        );
      })}

      <div ref={bottomRef}></div>

    </div>
  );
}
