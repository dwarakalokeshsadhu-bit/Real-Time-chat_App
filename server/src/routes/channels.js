import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createChannel,
  listChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  joinChannel,
  leaveChannel,
  listMembers,
  addMember,
  removeMember
} from '../controllers/channels.js';

const router = Router();
router.use(requireAuth);

// 🔥 NO AUTH (temporary stable version)

router.get('/', listChannels);
router.post('/', createChannel);

router.get('/:channelId', getChannel);
router.put('/:channelId', updateChannel);
router.delete('/:channelId', deleteChannel);

router.post('/:channelId/join', joinChannel);
router.post('/:channelId/leave', leaveChannel);

router.get('/:channelId/members', listMembers);
router.post('/:channelId/members', addMember);
router.delete('/:channelId/members/:userId', removeMember);

export default router;
