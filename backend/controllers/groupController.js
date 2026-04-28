import asyncHandler from 'express-async-handler';
import Group from '../models/Group.js';
import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Helper: safely delete a temp file
const cleanupFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (_) {}
};

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
const createGroup = asyncHandler(async (req, res) => {
    const filePath = req.file?.path;
    try {
        const { name, description } = req.body;
        
        if (!name || !description) {
            cleanupFile(filePath);
            return res.status(400).json({ message: 'Please provide name and description' });
        }

        let imageUrl = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(filePath, {
                folder: 'unilink/groups',
                resource_type: 'auto',
            });
            imageUrl = result.secure_url;
            cleanupFile(filePath);
        }

        const group = await Group.create({
            name,
            description,
            image: imageUrl,
            creator: req.user._id,
            members: [req.user._id]
        });

        res.status(201).json(group);
    } catch (error) {
        cleanupFile(filePath);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
const getGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find()
        .populate('creator', 'name profilePic')
        .populate('members', 'name profilePic')
        .sort({ createdAt: -1 });
        
    res.json(groups);
});

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id)
        .populate('creator', 'name profilePic')
        .populate('members', 'name profilePic');
    
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    res.json(group);
});

// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
const joinGroup = asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (group.members.some(id => id.toString() === req.user._id.toString())) {
        res.status(400);
        throw new Error('Already a member of this group');
    }

    group.members.push(req.user._id);
    await group.save();

    res.json({ message: 'Joined successfully', group });
});

// @desc    Get posts in a group
// @route   GET /api/groups/:id/posts
// @access  Private
const getGroupPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({ group: req.params.id })
        .populate('user', 'name profilePic')
        .populate('group', 'name')
        .populate('comments.user', 'name profilePic')
        .sort({ createdAt: -1 });
        
    res.json(posts);
});

// @desc    Update group image
// @route   PUT /api/groups/:id/image
// @access  Private
const updateGroupImage = asyncHandler(async (req, res) => {
    const filePath = req.file?.path;
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            cleanupFile(filePath);
            res.status(404);
            throw new Error('Group not found');
        }

        if (group.creator.toString() !== req.user._id.toString()) {
            cleanupFile(filePath);
            return res.status(403).json({ message: 'Only the group creator can update the community avatar' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'unilink/groups',
            resource_type: 'auto',
        });

        group.image = result.secure_url;
        await group.save();
        cleanupFile(filePath);

        res.json({ image: group.image, group });
    } catch (error) {
        cleanupFile(filePath);
        res.status(res.statusCode >= 400 ? res.statusCode : 500).json({ message: error.message });
    }
});

export { createGroup, getGroups, joinGroup, getGroupPosts, getGroupById, updateGroupImage };
