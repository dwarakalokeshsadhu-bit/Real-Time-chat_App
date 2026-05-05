import Message from "../models/Message.js";
import Channel from "../models/Channel.js";
import { ApiError } from "../utils/errors.js";
import { getIO } from "../sockets/index.js";

async function assertMessageOwner(messageId, username) {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const channel = await Channel.findById(message.channelId);
  if (!channel || !channel.members.includes(username)) {
    throw new ApiError(403, "Private channel");
  }

  if (message.senderId !== username) {
    throw new ApiError(403, "You can only change your own messages");
  }

  return { message, channel };
}

// 🔹 Get messages for a channel
export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    if (!channel.members.includes(req.user.username)) return res.status(403).json({ message: "Private channel" });

    const messages = await Message.find({
      channelId,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .populate('replyTo')
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });

  } catch (err) {
    console.log("GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Send message
export const sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, replyTo, fileUrl, fileType } = req.body;

    if (!content && !fileUrl) {
  return res.status(400).json({ message: "Content or file required" });
}

    const channel = await Channel.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel not found");
    if (!channel.members.includes(req.user.username)) throw new ApiError(403, "Private channel");
    const expiresAt = channel?.disappearingMessagesEnabled
      ? new Date(Date.now() + channel.disappearingMessageSeconds * 1000)
      : null;

    const message = await Message.create({
      channelId,
      content,
      senderId: req.user.username,
      replyTo: replyTo || null,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      expiresAt
    });

    // 🔥 EMIT HERE (inside try)
    const io = getIO();
    io.to(channelId).emit("newMessage", message);

    res.status(201).json({ success: true, message });

  } catch (err) {
    console.log("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 React to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const channel = await Channel.findById(message.channelId);
    if (!channel || !channel.members.includes(req.user.username)) {
      return res.status(403).json({ message: "Private channel" });
    }

    if (!message.reactions) {
      message.reactions = [];
    }

    message.reactions.push({
      emoji,
      userId: null
    });

    await message.save();

    // 🔥 EMIT HERE (inside try)
    const io = getIO();
    io.to(message.channelId.toString()).emit("reactionUpdate", message);

    res.json({ success: true, message });

  } catch (err) {
    console.log("REACTION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content required" });
    }

    const { message } = await assertMessageOwner(messageId, req.user.username);
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    const io = getIO();
    io.to(message.channelId.toString()).emit("messageUpdated", message);

    res.json({ success: true, message });
  } catch (err) {
    console.log("EDIT MESSAGE ERROR:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = await assertMessageOwner(messageId, req.user.username);
    const channelId = message.channelId.toString();

    await message.deleteOne();

    const io = getIO();
    io.to(channelId).emit("messageDeleted", { messageId });

    res.json({ success: true, messageId });
  } catch (err) {
    console.log("DELETE MESSAGE ERROR:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
  }
};
