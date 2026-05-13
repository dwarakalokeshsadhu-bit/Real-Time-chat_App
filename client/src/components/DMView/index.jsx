import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authSlice';
import { useDMStore } from '../../store/dmSlice';
import { socket } from '../../hooks/useSocket';
import Avatar from '../Avatar';

export default function DMView() {
  const user = useAuthStore(s => s.user);
  const activeDM = useDMStore(s => s.activeDM);
  const messages = useDMStore(s => s.dmMessages);
  const sendDMMessage = useDMStore(s => s.sendDMMessage);
  const editDMMessage = useDMStore(s => s.editDMMessage);
  const deleteDMMessage = useDMStore(s => s.deleteDMMessage);
  const addDMMessage = useDMStore(s => s.addDMMessage);
  const updateDMMessage = useDMStore(s => s.updateDMMessage);
  const removeDMMessage = useDMStore(s => s.removeDMMessage);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const previousMessageCountRef = useRef(messages.length);
  const previousDMRef = useRef(activeDM?._id);

  const other = activeDM?.participants?.find(participant => participant._id !== user?.id);

  useEffect(() => {
    if (!activeDM?._id) return;

    socket.emit('dm:join', activeDM._id);

    const handleNewMessage = (message) => {
      if (message.senderId === user?.username) return;
      addDMMessage(message);
    };
    const handleUpdate = (message) => updateDMMessage(message);
    const handleDelete = ({ messageId }) => removeDMMessage(messageId);

    socket.on('message:new', handleNewMessage);
    socket.on('message:update', handleUpdate);
    socket.on('message:delete', handleDelete);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:update', handleUpdate);
      socket.off('message:delete', handleDelete);
      socket.emit('dm:leave', activeDM._id);
    };
  }, [activeDM?._id, user?.username, addDMMessage, updateDMMessage, removeDMMessage]);

  const updateScrollState = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const distanceFromBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    setIsAwayFromBottom(distanceFromBottom > 140);
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();

    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollState);
    };
  }, []);

  useEffect(() => {
    if (previousDMRef.current !== activeDM?._id) {
      previousDMRef.current = activeDM?._id;
      previousMessageCountRef.current = messages.length;
      setNewMessageCount(0);
      requestAnimationFrame(updateScrollState);
    }
  }, [activeDM?._id, messages.length]);

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const addedCount = messages.length - previousCount;

    if (addedCount > 0 && previousDMRef.current === activeDM?._id) {
      setNewMessageCount(current => current + addedCount);
    }

    previousMessageCountRef.current = messages.length;
    requestAnimationFrame(updateScrollState);
  }, [messages.length, activeDM?._id]);

  const scrollToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setNewMessageCount(0);
    requestAnimationFrame(updateScrollState);
  };

  async function submit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    await sendDMMessage(content);
    setContent('');
  }

  async function saveEdit(messageId) {
    if (!editContent.trim()) return;
    await editDMMessage(messageId, editContent);
    setEditingId(null);
    setEditContent('');
  }

  async function remove(messageId) {
    if (!window.confirm('Delete this message?')) return;
    await deleteDMMessage(messageId);
  }

  const getSenderAvatar = (message) => {
    if (message.senderAvatarUrl) return message.senderAvatarUrl;
    if (message.senderId === user?.username) return user?.avatarUrl || '';
    return activeDM?.participants?.find(participant => participant.username === message.senderId)?.avatarUrl || '';
  };

  const formatMessageDate = (value) =>
    value
      ? new Date(value).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
      : '';

  if (!activeDM) return null;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>{other?.username || 'Direct message'}</h2>
          <div className="channel-meta">Private conversation</div>
        </div>
      </div>

      <div className="messages-area" ref={scrollContainerRef}>
        <div className="messages">
          {messages.map(message => {
            const isMine = message.senderId === user?.username;
            return (
              <div key={message._id} className={isMine ? 'message mine' : 'message'}>
                <div className="message-card">
                  <div className="message-user-row">
                    <Avatar src={getSenderAvatar(message)} name={message.senderId || 'User'} />
                    <div className="message-meta">
                      <span className="message-user">{message.senderId}</span>
                      <span className="message-date">{formatMessageDate(message.createdAt)}</span>
                    </div>
                  </div>
                  {editingId === message._id ? (
                    <div className="edit-message-box">
                      <textarea
                        value={editContent}
                        onChange={event => setEditContent(event.target.value)}
                        autoFocus
                      />
                      <div className="edit-message-actions">
                        <button onClick={() => saveEdit(message._id)}>Save</button>
                        <button onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="message-text">
                      {message.content}
                      {message.editedAt && <span className="edited-label"> edited</span>}
                    </p>
                  )}

                  {isMine && (
                    <div className="actions">
                      <button onClick={() => {
                        setEditingId(message._id);
                        setEditContent(message.content);
                      }}>
                        Edit
                      </button>
                      <button className="delete-message-btn" onClick={() => remove(message._id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}></div>
          {(isAwayFromBottom || newMessageCount > 0) && (
            <button type="button" className="scroll-latest-btn" onClick={scrollToLatest}>
              {newMessageCount > 0 ? `${newMessageCount} new messages` : 'Scroll to latest'}
            </button>
          )}
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
