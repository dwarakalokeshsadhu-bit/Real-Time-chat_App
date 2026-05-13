import { useEffect } from "react";
import { io } from "socket.io-client";
import { useMessageStore } from "../store/messageSlice";
import { useChannelStore } from "../store/channelSlice";
import { useAuthStore } from "../store/authSlice";
import { usePresenceStore } from "../store/presenceSlice";
import { useDMStore } from "../store/dmSlice";
import { api } from "../api";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  api.defaults.baseURL.replace(/\/api\/v1\/?$/, "");

export const socket = io(socketUrl, {
  autoConnect: true
});

export const useSocket = (channelId) => {
  const addMessage = useMessageStore(s => s.addMessage);
  const updateMessage = useMessageStore(s => s.updateMessage);
  const removeMessage = useMessageStore(s => s.removeMessage);
  const updateSenderAvatar = useMessageStore(s => s.updateSenderAvatar);
  const fetchMessages = useMessageStore(s => s.fetchMessages);
  const replaceChannel = useChannelStore(s => s.replaceChannel);
  const updateAuthAvatar = useAuthStore(s => s.updateUserAvatar);
  const updateDMAvatar = useDMStore(s => s.updateUserAvatar);
  const user = useAuthStore(s => s.user);
  const setOnlineUsers = usePresenceStore(s => s.setOnlineUsers);
  const updatePresenceAvatar = usePresenceStore(s => s.updateUserAvatar);
  const setTyping = usePresenceStore(s => s.setTyping);
  const clearTypingForChannel = usePresenceStore(s => s.clearTypingForChannel);

  useEffect(() => {
    if (user?.username) {
      socket.emit("presence:online", user);
    }

    const handlePresenceUpdate = (users) => {
      setOnlineUsers(users);
    };

    const handleAvatarUpdated = ({ username, avatarUrl }) => {
      updateAuthAvatar(username, avatarUrl);
      updateSenderAvatar(username, avatarUrl);
      updateDMAvatar(username, avatarUrl);
      updatePresenceAvatar(username, avatarUrl);
    };

    socket.on("presence:update", handlePresenceUpdate);
    socket.on("user:avatarUpdated", handleAvatarUpdated);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("user:avatarUpdated", handleAvatarUpdated);
    };
  }, [
    user,
    setOnlineUsers,
    updateAuthAvatar,
    updateSenderAvatar,
    updateDMAvatar,
    updatePresenceAvatar
  ]);

  useEffect(() => {
    if (!channelId) return;

    socket.emit("joinChannel", channelId);

    const handleNewMessage = (msg) => {
      addMessage(msg);
    };

    const handleReaction = (msg) => {
      updateMessage(msg);
    };

    const handleMessageDeleted = ({ messageId }) => {
      removeMessage(messageId);
    };

    const handleChannelUpdated = (channel) => {
      replaceChannel(channel);
      fetchMessages(channelId);
    };

    const handleTypingUpdate = (typing) => {
      setTyping(typing);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("reactionUpdate", handleReaction);
    socket.on("messageUpdated", handleReaction);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("channelUpdated", handleChannelUpdated);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("reactionUpdate", handleReaction);
      socket.off("messageUpdated", handleReaction);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("channelUpdated", handleChannelUpdated);
      socket.off("typing:update", handleTypingUpdate);
      clearTypingForChannel(channelId);

      socket.emit("leaveChannel", channelId);
    };
  }, [
    channelId,
    user,
    addMessage,
    updateMessage,
    removeMessage,
    fetchMessages,
    replaceChannel,
    setTyping,
    clearTypingForChannel
  ]);
};
