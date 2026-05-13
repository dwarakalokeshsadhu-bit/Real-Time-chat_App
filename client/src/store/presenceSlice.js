import { create } from 'zustand';

export const usePresenceStore = create((set) => ({
  onlineUsers: [],
  typingUsers: [],

  setOnlineUsers: (onlineUsers) => {
    set({ onlineUsers });
  },

  setTyping: ({ channelId, username, isTyping }) => {
    set((state) => {
      const typingUsers = state.typingUsers.filter(
        (entry) => !(entry.channelId === channelId && entry.username === username)
      );

      return {
        typingUsers: isTyping
          ? [...typingUsers, { channelId, username }]
          : typingUsers
      };
    });
  },

  updateUserAvatar: (username, avatarUrl) => {
    if (!username) return;

    set((state) => ({
      onlineUsers: state.onlineUsers.map(user =>
        user.username === username
          ? { ...user, avatarUrl: avatarUrl || '' }
          : user
      )
    }));
  },

  clearTypingForChannel: (channelId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((entry) => entry.channelId !== channelId)
    }));
  }
}));
