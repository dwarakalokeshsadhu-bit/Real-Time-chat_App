import { create } from 'zustand';
import { api } from '../api';

const isExpired = (message) =>
  message.expiresAt && new Date(message.expiresAt).getTime() <= Date.now();

const upsertMessage = (messages, nextMessage) => {
  if (!nextMessage || isExpired(nextMessage)) return messages;

  const exists = messages.some(message => message._id === nextMessage._id);
  if (exists) {
    return messages.map(message =>
      message._id === nextMessage._id ? { ...message, ...nextMessage } : message
    );
  }

  return [...messages, nextMessage];
};

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
      messages: upsertMessage(state.messages, data.message)
    }));


    return data; 
  } catch (err) {
    console.log("SEND ERROR:", err.response?.data || err.message);
    throw err.response?.data?.message || "Send failed";
  }
},

  async editMessage(channelId, messageId, content) {
    try {
      const { data } = await api.put(`/messages/${channelId}/${messageId}`, {
        content
      });

      get().updateMessage(data.message);
      return data.message;
    } catch (err) {
      console.log("EDIT ERROR:", err.response?.data || err.message);
      throw err.response?.data?.message || "Edit failed";
    }
  },

  async deleteMessage(channelId, messageId) {
    try {
      await api.delete(`/messages/${channelId}/${messageId}`);
      get().removeMessage(messageId);
    } catch (err) {
      console.log("DELETE ERROR:", err.response?.data || err.message);
      throw err.response?.data?.message || "Delete failed";
    }
  },

  addMessage(message) {
    set({
      messages: upsertMessage(get().messages, message)
    });
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
