import express from 'express';
import { createGroup, getMyGroups, getGroupById, joinGroup } from '../controllers/groupController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/')
    .post(protect, createGroup)
    .get(protect, getMyGroups);

router.post('/join', protect, joinGroup);
router.get('/:id', protect, getGroupById);

export default router;
