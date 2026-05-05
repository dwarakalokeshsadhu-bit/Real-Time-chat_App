import DirectMessage from '../models/DirectMessage.js';
import Message from '../models/Message.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

async function getOwnedDM(dmId, userId) {
  const dm = await DirectMessage.findOne({
    _id: dmId,
    participants: userId
  });

  if (!dm) throw new ApiError(404, 'Conversation not found');
  return dm;
}

export const listDMs = asyncHandler(async (req, res) => {
  const conversations = await DirectMessage.find({ participants: req.user._id })
    .populate('participants', 'username status avatarUrl')
    .sort({ lastMessageAt: -1 });

  res.json({ success: true, conversations });
});

export const startDM = asyncHandler(async (req, res) => {
  const participantIds = [...new Set([req.user._id.toString(), ...(req.body.participantIds || [])])];
  if (participantIds.length !== 2) throw new ApiError(400, 'Direct messages must have exactly two participants');

  let dm = await DirectMessage.findOne({
    participants: { $all: participantIds, $size: participantIds.length }
  });

  if (!dm) {
    dm = await DirectMessage.create({
      participants: participantIds,
      lastMessageAt: new Date()
    });
  }

  const full = await DirectMessage.findById(dm._id).populate('participants', 'username status avatarUrl');
  res.status(201).json({ success: true, dm: full });
});

export const getDMMessages = asyncHandler(async (req, res) => {
  await getOwnedDM(req.params.dmId, req.user._id);

  const messages = await Message.find({ dmId: req.params.dmId })
    .sort({ createdAt: 1 })
    .limit(100);

  res.json({ success: true, messages });
});

export const sendDMMessage = asyncHandler(async (req, res) => {
  await getOwnedDM(req.params.dmId, req.user._id);

  const message = await Message.create({
    dmId: req.params.dmId,
    senderId: req.user.username,
    content: req.body.content || ''
  });

  await DirectMessage.findByIdAndUpdate(req.params.dmId, { lastMessageAt: new Date() });
  req.app.get('io')?.to(`dm:${req.params.dmId}`).emit('message:new', message);
  res.status(201).json({ success: true, message });
});

export const editDMMessage = asyncHandler(async (req, res) => {
  await getOwnedDM(req.params.dmId, req.user._id);

  const message = await Message.findOne({
    _id: req.params.messageId,
    dmId: req.params.dmId
  });

  if (!message) throw new ApiError(404, 'Message not found');
  if (message.senderId !== req.user.username) throw new ApiError(403, 'You can only edit your own messages');
  if (!req.body.content?.trim()) throw new ApiError(400, 'Message content required');

  message.content = req.body.content.trim();
  message.editedAt = new Date();
  await message.save();

  req.app.get('io')?.to(`dm:${req.params.dmId}`).emit('message:update', message);
  res.json({ success: true, message });
});

export const deleteDMMessage = asyncHandler(async (req, res) => {
  await getOwnedDM(req.params.dmId, req.user._id);

  const message = await Message.findOne({
    _id: req.params.messageId,
    dmId: req.params.dmId
  });

  if (!message) throw new ApiError(404, 'Message not found');
  if (message.senderId !== req.user.username) throw new ApiError(403, 'You can only delete your own messages');

  await message.deleteOne();

  req.app.get('io')?.to(`dm:${req.params.dmId}`).emit('message:delete', {
    messageId: req.params.messageId
  });
  res.json({ success: true, messageId: req.params.messageId });
});
