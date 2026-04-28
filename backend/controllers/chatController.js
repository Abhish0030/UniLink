import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import User from '../models/User.js';
import fs from 'fs';
import { storeUploadedFile } from '../utils/mediaStorage.js';

const cleanupFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (_) {}
};

// @desc    Get message history between two users
// @route   GET /api/chat/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId },
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get list of users the current user has chatted with
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Find all unique users who have sent messages to or received messages from the current user
        const messages = await Message.find({
            $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        }).sort({ createdAt: -1 });

        const chattedUserIds = new Set();
        messages.forEach((msg) => {
            if (msg.sender.toString() !== currentUserId.toString()) {
                chattedUserIds.add(msg.sender.toString());
            }
            if (msg.receiver.toString() !== currentUserId.toString()) {
                chattedUserIds.add(msg.receiver.toString());
            }
        });

        const users = await User.find({ _id: { $in: Array.from(chattedUserIds) } }).select('name profilePic bio');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const imagePath = req.files?.image?.[0]?.path;
    const videoPath = req.files?.video?.[0]?.path;
    try {
        const { receiverId, text } = req.body;
        const senderId = req.user._id;

        if (!receiverId) {
            cleanupFile(imagePath);
            cleanupFile(videoPath);
            return res.status(400).json({ message: 'Receiver is required' });
        }

        let imageUrl = '';
        let videoUrl = '';

        if (req.files?.image?.[0]) {
            const storedImage = await storeUploadedFile(imagePath, {
                folder: 'unilink/chat/images',
                resource_type: 'image',
            });
            imageUrl = storedImage.url;
            if (storedImage.provider === 'cloudinary') cleanupFile(imagePath);
        }

        if (req.files?.video?.[0]) {
            const storedVideo = await storeUploadedFile(videoPath, {
                folder: 'unilink/chat/videos',
                resource_type: 'video',
            });
            videoUrl = storedVideo.url;
            if (storedVideo.provider === 'cloudinary') cleanupFile(videoPath);
        }

        const cleanText = text?.trim() || '';
        if (!cleanText && !imageUrl && !videoUrl) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            text: cleanText,
            image: imageUrl,
            video: videoUrl,
        });

        res.status(201).json(message);
    } catch (error) {
        cleanupFile(imagePath);
        cleanupFile(videoPath);
        res.status(500).json({ message: error.message });
    }
});

export { getMessages, getConversations, sendMessage };
