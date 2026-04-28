import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Users, Info, Calendar, MessageSquare, Plus, UserPlus, Check, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import { resolveMediaUrl } from '../services/media';

const GroupDetail = () => {
    const { id } = useParams();
    const { user: currentUser, isAuthenticated } = useAuth();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postText, setPostText] = useState('');
    const [posting, setPosting] = useState(false);
    const [updatingImage, setUpdatingImage] = useState(false);
    const imageInputRef = useRef(null);

    const fetchGroupData = useCallback(async () => {
        try {
            const [{ data: groupData }, { data: postsData }] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/groups/${id}/posts`)
            ]);
            setGroup(groupData);
            setPosts(postsData);
        } catch (error) {
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    const handleJoin = async () => {
        if (!isAuthenticated) return toast.info('Please login to join groups');
        setJoining(true);
        try {
            await api.post(`/groups/${id}/join`);
            toast.success(`Welcome to ${group.name}! 👋`);
            fetchGroupData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join group');
        } finally {
            setJoining(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postText.trim()) return;
        setPosting(true);
        try {
            await api.post('/posts', { text: postText, groupId: id });
            toast.success('Posted in community! 🚀');
            setPostText('');
            setIsPostModalOpen(false);
            fetchGroupData();
        } catch (error) {
            toast.error('Failed to post');
        } finally {
            setPosting(false);
        }
    };

    const isMember = group?.members?.some(m => (m._id || m) === currentUser?._id);
    const isCreator = Boolean(currentUser?._id && (group?.creator?._id || group?.creator) === currentUser._id);

    const handleGroupImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const formData = new FormData();
        formData.append('image', file);

        setUpdatingImage(true);
        try {
            await api.put(`/groups/${id}/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Community avatar updated');
            fetchGroupData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update community avatar');
        } finally {
            setUpdatingImage(false);
        }
    };

    if (loading) return <Loader fullPage />;
    if (!group) return <div className="p-20 text-center font-bold text-primary text-2xl">Group not found</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Group Header */}
            <div className="glass-card overflow-hidden mb-8 border border-accent/10">
                <div className="h-48 bg-panel relative" />
                <div className="p-8 -mt-16 relative">
                    <div className="flex flex-col md:flex-row items-end md:items-start gap-6">
                        <div className="relative w-32 h-32 rounded-3xl bg-button shadow-2xl flex items-center justify-center text-white border-8 border-surface shrink-0 overflow-hidden">
                            {group.image ? (
                                <img src={resolveMediaUrl(group.image)} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                                <Users size={60} />
                            )}
                            {isCreator && (
                                <>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleGroupImageChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={updatingImage}
                                        className="absolute bottom-2 right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-60"
                                        title="Update community avatar"
                                    >
                                        <Camera size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left mt-2">
                            <h1 className="text-4xl font-black text-ink tracking-tight mb-2">{group.name}</h1>
                            <p className="text-ink/70 font-medium max-w-2xl">{group.description}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                                <span className="flex items-center gap-1.5 text-sm font-bold text-ink/50 bg-background/50 px-4 py-1.5 rounded-full border border-accent/10">
                                    <Users size={16} className="text-primary" />
                                    {group.members?.length} Members
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-bold text-ink/50 bg-background/50 px-4 py-1.5 rounded-full border border-accent/10">
                                    <Calendar size={16} className="text-primary" />
                                    Created {new Date(group.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            {isMember ? (
                                <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-600 rounded-2xl font-bold border border-green-200">
                                    <Check size={20} />
                                    Joined
                                </div>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="btn-primary px-10 py-3 font-black shadow-lg shadow-button/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <UserPlus size={20} />
                                    {joining ? 'Joining...' : 'Join Community'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Posts Section */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-ink flex items-center gap-2">
                            <MessageSquare className="text-primary" />
                            Community Feed
                        </h2>
                        {isMember && (
                            <button
                                onClick={() => setIsPostModalOpen(true)}
                                className="btn-primary px-4 py-2 text-sm flex items-center gap-2 font-black shadow-md shadow-button/10"
                            >
                                <Plus size={18} />
                                New Group Post
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {posts.length > 0 ? (
                            posts.map(post => <PostCard key={post._id} post={post} />)
                        ) : (
                            <div className="glass-card p-20 text-center border-dashed border-2 border-accent/20">
                                <MessageSquare size={48} className="mx-auto mb-4 text-ink/10" />
                                <h3 className="text-xl font-bold text-ink/30 uppercase tracking-widest">No posts yet</h3>
                                <p className="text-ink/20 mt-2">Be the first to share something in this community!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="glass-card p-6 border border-accent/10">
                        <h3 className="text-lg font-black text-ink mb-4 flex items-center gap-2">
                            <Info size={18} className="text-primary" />
                            About Community
                        </h3>
                        <p className="text-ink/60 text-sm leading-relaxed mb-6">
                            {group.description}
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-ink/40">
                                <span>Members</span>
                                <span className="text-ink">{group.members?.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-ink/40">
                                <span>Total Posts</span>
                                <span className="text-ink">{posts.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Members List (Top 10) */}
                    <div className="glass-card p-6 border border-accent/10">
                        <h3 className="text-lg font-black text-ink mb-4 flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Top Members
                        </h3>
                        <div className="space-y-4">
                            {group.members?.slice(0, 5).map(member => (
                                <Link key={member._id} to={`/profile/${member._id}`} className="flex items-center gap-3 group">
                                    <img 
                                        src={resolveMediaUrl(member.profilePic) || `https://api.dicebear.com/7.x/thumbs/svg?seed=${member.name}`} 
                                        alt={member.name}
                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-button transition-all"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-ink group-hover:text-primary transition-colors">{member.name}</p>
                                        <p className="text-[10px] text-ink/40 font-bold uppercase tracking-tighter">Member</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Post in Group Modal */}
            <AnimatePresence>
                {isPostModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPostModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-surface rounded-[2rem] overflow-hidden shadow-2xl border border-accent/20"
                        >
                            <form onSubmit={handleCreatePost} className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-button flex items-center justify-center text-ink">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-ink">Post in {group.name}</h2>
                                        <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">Share with members</p>
                                    </div>
                                </div>
                                <textarea
                                    required
                                    rows="5"
                                    autoFocus
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    placeholder="What's happening in the community?"
                                    className="input-field px-6 py-5 font-semibold resize-none text-lg bg-background/30"
                                />
                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setIsPostModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-ink/60 hover:bg-accent/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={posting || !postText.trim()}
                                        className="flex-[2] btn-primary py-4 font-black uppercase tracking-widest shadow-xl shadow-button/20 disabled:opacity-50"
                                    >
                                        {posting ? 'Posting...' : 'Post to Community'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupDetail;
