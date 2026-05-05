import { useEffect } from 'react';
import { useMessageStore } from '../store/messageSlice';

export function useMessages(channelId) {
  const fetchMessages = useMessageStore(s => s.fetchMessages);
  const messages = useMessageStore(s => s.messages);
  useEffect(() => { fetchMessages(channelId); }, [channelId]);
  return messages;
}
