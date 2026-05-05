import React, { useState, useEffect } from 'react';
import MessageList from '../MessageList';
import MessageInput from '../MessageInput';
import CallPanel from '../CallPanel';
import { useMessageStore } from '../../store/messageSlice';
import { useChannelStore } from '../../store/channelSlice';
import { useAuthStore } from '../../store/authSlice';
import { usePresenceStore } from '../../store/presenceSlice';

export default function ChannelView({ channelId }) {

  const messages = useMessageStore(s => s.messages);
  const fetchMessages = useMessageStore(s => s.fetchMessages);
  const removeExpiredMessages = useMessageStore(s => s.removeExpiredMessages);
  const activeChannel = useChannelStore(s => s.activeChannel);
  const user = useAuthStore(s => s.user);
  const onlineUsers = usePresenceStore(s => s.onlineUsers);
  const typingUsers = usePresenceStore(s => s.typingUsers);

  const [replyTo, setReply] = useState(null);
  const memberNames = activeChannel?.members || [];
  const onlineNames = new Set(onlineUsers.map(member => member.username));
  const activeCount = memberNames.filter(member => onlineNames.has(member)).length;
  const channelTypingUsers = typingUsers
    .filter(entry => entry.channelId === channelId && entry.username !== user?.username)
    .map(entry => entry.username);
  const disappearingText = activeChannel?.disappearingMessagesEnabled
    ? `Disappearing messages after ${formatDisappearingTime(activeChannel.disappearingMessageSeconds)}`
    : 'Disappearing messages off';

  useEffect(() => {
    if (channelId) {
      fetchMessages(channelId);
    }
  }, [channelId]);

  useEffect(() => {
    const timer = setInterval(removeExpiredMessages, 1000);
    return () => clearInterval(timer);
  }, [removeExpiredMessages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2># {activeChannel?.name || 'Select a channel'}</h2>
          <div className="channel-meta">
            <span className="online-dot"></span>
            <span>{activeCount} members online</span>
            <span className="meta-separator">.</span>
            <span>{disappearingText}</span>
          </div>
        </div>
        <CallPanel channelId={channelId} />
      </div>

      <div className="messages-area">
        <MessageList
          messages={messages}
          channelId={channelId}
          setReply={setReply}
        />
      </div>

      <div className="input-area">
        {channelTypingUsers.length > 0 && (
          <div className="typing-indicator">
            {channelTypingUsers.join(', ')} {channelTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <MessageInput
          channelId={channelId}
          replyTo={replyTo}
          clearReply={() => setReply(null)}
        />
      </div>

    </div>
  );
}

function formatDisappearingTime(seconds = 86400) {
  if (seconds < 3600) return pluralize(Math.round(seconds / 60), 'minute');
  if (seconds < 86400) return pluralize(Math.round(seconds / 3600), 'hour');
  return pluralize(Math.round(seconds / 86400), 'day');
}

function pluralize(value, unit) {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}
