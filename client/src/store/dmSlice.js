import { create } from 'zustand';
import { api } from '../api';

export const useDMStore = create((set, get) => ({
  conversations: [],
  activeDM: null,
  dmMessages: [],
  userResults: [],

  fetchDMs: async () => {
    const { data } = await api.get('/dm');
    set({ conversations: data.conversations || [] });
  },

  searchUsers: async (query) => {
    if (!query.trim()) return set({ userResults: [] });
    const { data } = await api.get(`/auth/users/search?q=${encodeURIComponent(query)}`);
    set({ userResults: data.users || [] });
  },

  startDM: async (userId) => {
    const { data } = await api.post('/dm', { participantIds: [userId] });
    set((state) => ({
      conversations: [
        data.dm,
        ...state.conversations.filter(conversation => conversation._id !== data.dm._id)
      ],
      activeDM: data.dm,
      userResults: []
    }));
    await get().fetchDMMessages(data.dm._id);
  },

  setActiveDM: async (conversation) => {
    set({ activeDM: conversation });
    await get().fetchDMMessages(conversation._id);
  },

  clearActiveDM: () => {
    set({ activeDM: null, dmMessages: [] });
  },

  fetchDMMessages: async (dmId) => {
    const { data } = await api.get(`/dm/${dmId}`);
    set({ dmMessages: data.messages || [] });
  },

  sendDMMessage: async (content) => {
    const activeDM = get().activeDM;
    if (!activeDM || !content.trim()) return;

    const { data } = await api.post(`/dm/${activeDM._id}`, { content });
    set((state) => ({ dmMessages: [...state.dmMessages, data.message] }));
  },

  addDMMessage: (message) => {
    set((state) => ({ dmMessages: [...state.dmMessages, message] }));
  },

  updateDMMessage: (updated) => {
    set((state) => ({
      dmMessages: state.dmMessages.map(message =>
        message._id === updated._id ? updated : message
      )
    }));
  },

  removeDMMessage: (messageId) => {
    set((state) => ({
      dmMessages: state.dmMessages.filter(message => message._id !== messageId)
    }));
  },

  updateUserAvatar: (username, avatarUrl) => {
    if (!username) return;

    const updateParticipant = (participant) =>
      participant?.username === username
        ? { ...participant, avatarUrl: avatarUrl || '' }
        : participant;

    set((state) => ({
      conversations: state.conversations.map(conversation => ({
        ...conversation,
        participants: (conversation.participants || []).map(updateParticipant)
      })),
      activeDM: state.activeDM
        ? {
            ...state.activeDM,
            participants: (state.activeDM.participants || []).map(updateParticipant)
          }
        : state.activeDM,
      userResults: state.userResults.map(updateParticipant),
      dmMessages: state.dmMessages.map(message =>
        message.senderId === username
          ? { ...message, senderAvatarUrl: avatarUrl || '' }
          : message
      )
    }));
  },

  editDMMessage: async (messageId, content) => {
    const activeDM = get().activeDM;
    if (!activeDM || !content.trim()) return;

    const { data } = await api.put(`/dm/${activeDM._id}/${messageId}`, { content });
    get().updateDMMessage(data.message);
  },

  deleteDMMessage: async (messageId) => {
    const activeDM = get().activeDM;
    if (!activeDM) return;

    await api.delete(`/dm/${activeDM._id}/${messageId}`);
    get().removeDMMessage(messageId);
  }
}));
