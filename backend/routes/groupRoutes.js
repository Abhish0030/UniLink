import express from 'express';
import { createGroup, getGroups, joinGroup, getGroupById, getGroupPosts, updateGroupImage } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleProfileUpload } from '../middleware/profileUploadMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, handleProfileUpload, createGroup)
    .get(protect, getGroups);

router.get('/:id', protect, getGroupById);
router.post('/:id/join', protect, joinGroup);
router.get('/:id/posts', protect, getGroupPosts);
router.put('/:id/image', protect, handleProfileUpload, updateGroupImage);

export default router;
