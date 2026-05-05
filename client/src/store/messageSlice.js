import { create } from 'zustand';
import { api } from '../api';

const isExpired = (message) =>
  message.expiresAt && new Date(message.expiresAt).getTime() <= Date.now();

export const useMessageStore = create((set, get) => ({
  messages: [],

  async fetchMessages(channelId) {
    if (!channelId) return set({ messages: [] });

    const { data } = await api.get(`/messages/${channelId}`);
    set({ messages: (data.messages || []).filter(message => !isExpired(message)) });
  },
async sendMessage(channelId, content, replyTo, fileUrl, fileType) {
  try {
    const { data } = await api.post(`/messages/${channelId}`, {
      content,
      replyTo,
      fileUrl,
      fileType,
      username: JSON.parse(localStorage.getItem("user"))?.username
    });
    
    set(state => ({
      messages: [...state.messages, data.message].filter(message => !isExpired(message))
    }));


    return data; 
  } catch (err) {
    console.log("SEND ERROR:", err.response?.data || err.message);
    throw err.response?.data?.message || "Send failed";
  }
},

  addMessage(message) {
    if (isExpired(message)) return;
    set({ messages: [...get().messages, message] });
  },

  updateMessage(updated) {
    set({
      messages: get().messages.map(m =>
        m._id === updated._id ? { ...m, ...updated } : m
      )
    });
  },

  removeMessage(messageId) {
    set({
      messages: get().messages.filter(m => m._id !== messageId)
    });
  },

  removeExpiredMessages() {
    set({
      messages: get().messages.filter(message => !isExpired(message))
    });
  }
}));
