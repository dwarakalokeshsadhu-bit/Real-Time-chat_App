import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import { getIO } from '../sockets/index.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

function assertMember(channel, username) {
  if (!channel.members.includes(username)) throw new ApiError(403, 'Private channel');
}

export const listChannels = asyncHandler(async (req, res) => {
  const channels = await Channel.find({
    members: req.user.username,
    isArchived: false
  });

  res.json({ success: true, channels });
});

export const createChannel = asyncHandler(async (req, res) => {
  const { name, description = '', type = 'private' } = req.body;

  if (!name?.trim()) throw new ApiError(400, 'Channel name required');

  const members = [...new Set([...(req.body.members || []), req.user.username])];
  const channel = await Channel.create({
    name: name.trim(),
    description,
    type,
    createdBy: req.user.username,
    members
  });

  res.status(201).json({ success: true, channel });
});

export const getChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');
  assertMember(channel, req.user.username);
  res.json({ success: true, channel });
});

export const updateChannel = asyncHandler(async (req, res) => {
  const existing = await Channel.findById(req.params.channelId);
  if (!existing) throw new ApiError(404, 'Channel not found');
  assertMember(existing, req.user.username);

  const allowedUpdates = {
    name: req.body.name,
    description: req.body.description,
    disappearingMessagesEnabled: req.body.disappearingMessagesEnabled,
    disappearingMessageSeconds: req.body.disappearingMessageSeconds
  };
  Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

  const channel = await Channel.findByIdAndUpdate(req.params.channelId, allowedUpdates, { new: true });

  if ('disappearingMessagesEnabled' in allowedUpdates || 'disappearingMessageSeconds' in allowedUpdates) {
    if (channel.disappearingMessagesEnabled) {
      const expiresAt = new Date(Date.now() + channel.disappearingMessageSeconds * 1000);
      await Message.updateMany({ channelId: channel._id }, { $set: { expiresAt } });
    } else {
      await Message.updateMany({ channelId: channel._id }, { $unset: { expiresAt: '' } });
    }
  }

  getIO()?.to(req.params.channelId).emit('channelUpdated', channel);
  res.json({ success: true, channel });
});

export const deleteChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');
  if (channel.createdBy !== req.user.username && req.user.role !== 'admin') throw new ApiError(403, 'Only the owner can archive this channel');

  await Channel.findByIdAndUpdate(req.params.channelId, { isArchived: true });
  res.json({ success: true, message: 'Channel archived' });
});

export const joinChannel = asyncHandler(async (req, res) => {
  throw new ApiError(403, 'Ask a group member to add you to this private channel');
});

export const leaveChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findByIdAndUpdate(
    req.params.channelId,
    { $pull: { members: req.user.username } },
    { new: true }
  );
  res.json({ success: true, channel });
});

export const listMembers = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');
  assertMember(channel, req.user.username);

  res.json({
    success: true,
    members: channel.members.map(username => ({ username }))
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');
  assertMember(channel, req.user.username);

  const username = req.body.username || req.body.userId;
  if (!username) throw new ApiError(400, 'Username is required');

  channel.members.addToSet(username);
  await channel.save();
  res.json({ success: true, channel });
});

export const removeMember = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');
  assertMember(channel, req.user.username);

  channel.members.pull(req.params.userId);
  await channel.save();
  res.json({ success: true, channel });
});
