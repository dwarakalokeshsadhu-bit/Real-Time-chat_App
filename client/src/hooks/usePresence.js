import { useState } from 'react';
export function usePresence() {
  const [onlineUsers] = useState([]);
  return onlineUsers;
}
