import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authSlice';
import { useChannelStore } from '../../store/channelSlice';
import { useDMStore } from '../../store/dmSlice';

export default function DMList() {
  const user = useAuthStore(s => s.user);
  const setActiveChannel = useChannelStore(s => s.setActiveChannel);
  const {
    conversations,
    activeDM,
    userResults,
    fetchDMs,
    searchUsers,
    startDM,
    setActiveDM
  } = useDMStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchDMs().catch(() => {});
  }, [fetchDMs]);

  const otherParticipant = (conversation) =>
    conversation.participants?.find(participant => participant._id !== user?.id);

  const chooseDM = async (conversation) => {
    setActiveChannel(null);
    await setActiveDM(conversation);
  };

  const beginDM = async (userId) => {
    setActiveChannel(null);
    setQuery('');
    await startDM(userId);
  };

  return (
    <div className="dm-section">
      <h3>Direct Messages</h3>
      <input
        className="dm-search"
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          searchUsers(value).catch(() => {});
        }}
        placeholder="Search username"
      />

      {userResults.length > 0 && (
        <div className="dm-results">
          {userResults.map(result => (
            <button key={result._id} onClick={() => beginDM(result._id)}>
              {result.avatarUrl ? <img src={result.avatarUrl} alt="" /> : <span>{result.username.charAt(0)}</span>}
              <span>{result.username}</span>
            </button>
          ))}
        </div>
      )}

      {conversations.map(conversation => {
        const other = otherParticipant(conversation);
        if (!other) return null;

        return (
          <button
            key={conversation._id}
            className={activeDM?._id === conversation._id ? 'dm-item active' : 'dm-item'}
            onClick={() => chooseDM(conversation)}
          >
            {other.avatarUrl ? <img src={other.avatarUrl} alt="" /> : <span>{other.username.charAt(0)}</span>}
            <span>{other.username}</span>
          </button>
        );
      })}
    </div>
  );
}
