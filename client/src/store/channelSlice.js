import { create } from 'zustand';
import { api } from '../api';

export const useChannelStore = create((set, get) => ({

  channels: [],
  activeChannel: null,

  // 🔥 Fetch only user's channels
  fetchChannels: async () => {
    try {
      const { data } = await api.get('/channels');

      const channels = data.channels || data;

      set((state) => {
        const refreshedActiveChannel =
          state.activeChannel &&
          channels.find(c => c._id === state.activeChannel._id);

        return {
          channels,
          activeChannel: refreshedActiveChannel || channels[0] || null
        };
      });

    } catch (err) {
      console.log("Fetch channels error:", err);
    }
  },

  // 🔹 Set active channel
  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
  },

  // 🔥 Create channel (supports groups now)
  replaceChannel: (updatedChannel) => {
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel._id === updatedChannel._id ? updatedChannel : channel
      ),
      activeChannel:
        state.activeChannel?._id === updatedChannel._id
          ? updatedChannel
          : state.activeChannel
    }));
  },

  updateChannel: async (channelId, updates) => {
    try {
      const { data } = await api.put(`/channels/${channelId}`, updates);

      set((state) => ({
        channels: state.channels.map((channel) =>
          channel._id === channelId ? data.channel : channel
        ),
        activeChannel:
          state.activeChannel?._id === channelId
            ? data.channel
            : state.activeChannel
      }));

      return data.channel;
    } catch (err) {
      throw err.response?.data?.message || "Error updating channel";
    }
  },

  createChannel: async ({ name, members = [], type = "public" }) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        name,
        members,
        type,
        createdBy: user?.username // optional
      };

      const { data } = await api.post('/channels', payload);

      // 🔥 immediately update UI (no refresh delay)
      set((state) => ({
        channels: [...state.channels, data.channel],
        activeChannel: data.channel // auto-select new channel
      }));

      return data;

    } catch (err) {
      throw err.response?.data?.message || "Error creating channel";
    }
  }

}));
