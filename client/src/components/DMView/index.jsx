import React, { useState } from 'react';
import { useAuthStore } from '../../store/authSlice';
import { useDMStore } from '../../store/dmSlice';

export default function DMView() {
  const user = useAuthStore(s => s.user);
  const activeDM = useDMStore(s => s.activeDM);
  const messages = useDMStore(s => s.dmMessages);
  const sendDMMessage = useDMStore(s => s.sendDMMessage);
  const [content, setContent] = useState('');

  const other = activeDM?.participants?.find(participant => participant._id !== user?.id);

  async function submit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    await sendDMMessage(content);
    setContent('');
  }

  if (!activeDM) return null;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>{other?.username || 'Direct message'}</h2>
          <div className="channel-meta">Private conversation</div>
        </div>
      </div>

      <div className="messages-area">
        <div className="messages">
          {messages.map(message => {
            const isMine = message.senderId === user?.username;
            return (
              <div key={message._id} className={isMine ? 'message mine' : 'message'}>
                <div className="message-card">
                  {!isMine && (
                    <div className="message-user-row">
                      <div className="message-avatar">{(message.senderId || 'U').charAt(0).toUpperCase()}</div>
                      <div className="message-user">{message.senderId}</div>
                    </div>
                  )}
                  <p className="message-text">{message.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="input-area">
        <form className="input-row" onSubmit={submit}>
          <input
            className="chat-input"
            value={content}
            onChange={event => setContent(event.target.value)}
            placeholder="Type a private message..."
          />
          <button type="submit" className="send-btn">Send</button>
        </form>
      </div>
    </div>
  );
}
