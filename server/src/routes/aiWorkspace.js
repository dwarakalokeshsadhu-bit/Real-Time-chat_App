import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { askMemory, getMemories, getSummary, getTasks, updateTask } from '../controllers/aiWorkspace.js';

const router = Router();
router.use(requireAuth);

router.get('/:channelId/memories', getMemories);
router.post('/:channelId/ask', askMemory);
router.get('/:channelId/tasks', getTasks);
router.patch('/:channelId/tasks/:taskId', updateTask);
router.get('/:channelId/summary', getSummary);

export default router;
