import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, FileText, Download, Send, User, UserPlus, UserMinus, Edit3, Trash2, Play, Pause } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { toast } from 'react-toastify';
import { getAvatarUrl, resolveMediaUrl } from '../services/media';

const PostCard = ({ post }) => {
    const { isAuthenticated, user: currentUser, toggleFollow } = useAuth();
    const { likePost, addComment, deletePost, editPost } = usePosts();
    const navigate = useNavigate();
    const MotionDiv = motion.div;

    const authorId = typeof post.user === 'object' ? post.user?._id : post.user;
    const isOwnPost = Boolean(currentUser?._id && authorId && String(currentUser._id) === String(authorId));
    const isAdmin = currentUser?.role === 'admin';
    const canManagePost = isOwnPost || isAdmin;

    // Compute follow state with normalised IDs
    const computeIsFollowing = () => {
        if (!currentUser || isOwnPost) return false;
        const followingIds = (currentUser.following || []).map(i =>
            i?._id ? String(i._id) : String(i)
        );
        const authorId = post.user?._id ? String(post.user._id) : '';
        return followingIds.includes(authorId);
    };

    const [isFollowingAuthor, setIsFollowingAuthor] = useState(() => computeIsFollowing());
    const [followLoading, setFollowLoading] = useState(false);
    
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isLiking, setIsLiking] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(post.text || '');
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const handleShare = () => {
        const postUrl = `${window.location.origin}/post/${post._id}`;
        navigator.clipboard.writeText(postUrl);
        toast.success('Link copied to clipboard! 📋', {
            icon: '🔗'
        });
    };

    // Sync isFollowingAuthor when currentUser.following changes
    useEffect(() => {
        setIsFollowingAuthor(computeIsFollowing());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.following]);

    const menuRef = useRef();
    const videoRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        function handleCloseOtherMenus(event) {
            if (event.detail !== post._id) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("closeOtherMenus", handleCloseOtherMenus);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("closeOtherMenus", handleCloseOtherMenus);
        };
    }, [post._id]);

    const handleFollowAuthor = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.info('Please login to follow users');
            navigate('/login');
            return;
        }
        setFollowLoading(true);
        const result = await toggleFollow(authorId);
        if (result.success) {
            setIsFollowingAuthor(result.isNowFollowing);
            toast.success(result.isNowFollowing ? `Following ${post.user?.name}! 👋` : `Unfollowed ${post.user?.name}`);
        } else {
            toast.error(result.message);
        }
        setFollowLoading(false);
    };

  const isLiked = post.likedBy?.some(id => {
      const likedId = id?._id ? String(id._id) : String(id);
      return likedId === String(currentUser?._id);
  });
  const handleLike = async () => {
    if (!isAuthenticated || !currentUser) {
        toast.info('Please login to like posts! ❤️');
        navigate('/login');
        return;
    }
    setIsLiking(true);
    await likePost(post._id, currentUser._id);
    setIsLiking(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    
    await addComment(post._id, commentText, currentUser);
    setCommentText('');
  };

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      return;
    }
    videoRef.current.pause();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6 sm:p-8 mb-8 hover:shadow-2xl transition-all duration-500 rounded-[32px] group relative"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${post.user?._id}`} className="relative group/avatar cursor-pointer">
            <img
                src={getAvatarUrl(post.user)}
                alt={post.user?.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-primary/30 bg-surface p-0.5 object-cover group-hover/avatar:scale-105 transition-transform"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-surface rounded-full sm:w-5 sm:h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.user?._id}`} className="cursor-pointer group/name">
                <h4 className="font-black text-ink text-lg sm:text-xl group-hover/name:text-primary transition-colors">{post.user?.name}</h4>
              </Link>
              {post.group && (
                <>
                  <span className="text-ink/30 font-black">·</span>
                  <Link to={`/groups/${post.group?._id || post.group}`} className="text-primary font-bold hover:underline text-sm">
                    {post.group?.name || 'Group'}
                  </Link>
                </>
              )}
            </div>
            <Link to={`/post/${post._id}`} className="hover:underline transition-all">
                <p className="text-[10px] text-ink/60 font-bold uppercase tracking-widest">{formatDate(post.createdAt)}</p>
            </Link>
          </div>

          {/* Inline Follow button — hidden on own posts */}
          {isAuthenticated && !isOwnPost && post.user && (
            <button
              onClick={handleFollowAuthor}
              disabled={followLoading}
              title={isFollowingAuthor ? 'Unfollow' : 'Follow'}
              className={`ml-1 flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                isFollowingAuthor
                  ? 'bg-accent/10 text-ink/70 border border-accent/20 hover:bg-red-500/10 hover:text-red-500'
                  : 'bg-button/15 text-button border border-button/25 hover:bg-button/25'
              }`}
            >
              {isFollowingAuthor
                ? <><UserMinus size={12} /> Following</>
                : <><UserPlus size={12} /> Follow</>
              }
            </button>
          )}
        </div>
        <div className="flex gap-2 relative">
            {canManagePost && (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!showMenu) {
                            window.dispatchEvent(new CustomEvent("closeOtherMenus", { detail: post._id }));
                        }
                        setShowMenu(!showMenu);
                    }}
                    className={`p-2 rounded-xl transition-all ${showMenu ? 'bg-accent/10 text-accent' : 'text-ink/40 hover:text-accent hover:bg-accent/5'}`}
                    title="Post Options"
                  >
                    <MoreHorizontal size={20} strokeWidth={2.5} />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <MotionDiv
                        initial={{ opacity: 0, scale: 0.9, y: -10, originX: 'right', originY: 'top' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute right-0 mt-2 w-48 glass-card bg-surface/95 backdrop-blur-xl border border-accent/20 shadow-2xl rounded-2xl z-50 overflow-hidden py-1"
                      >
                        {isOwnPost && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              setIsEditing(true);
                              setEditedText(post.text || '');
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-ink hover:bg-accent/10 transition-colors font-bold flex items-center gap-3"
                          >
                            <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
                                <Edit3 size={14} />
                            </div>
                            Edit Post
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            if (window.confirm("🗑️ Are you sure you want to delete this post permanently?")) {
                              deletePost(post._id);
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors font-bold flex items-center gap-3"
                        >
                          <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                              <Trash2 size={14} />
                          </div>
                          Delete Post
                        </button>
                      </MotionDiv>
                    )}
                  </AnimatePresence>
                </div>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 mb-8">
        {isEditing && (
            <div className="flex flex-col gap-3">
               <textarea
                 value={editedText}
                 onChange={(e) => setEditedText(e.target.value)}
                 className="input-field p-4 text-ink leading-relaxed rounded-xl w-full min-h-[100px]"
                 placeholder="What do you want to talk about?"
               />
               <div className="flex justify-end gap-2">
                 <button 
                   onClick={() => setIsEditing(false)}
                   className="px-4 py-2 rounded-xl hover:bg-accent/10 text-ink/60 transition-colors text-sm font-semibold"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => {
                     editPost(post._id, editedText);
                     setIsEditing(false);
                   }}
                   className="px-4 py-2 rounded-xl bg-accent text-white hover:opacity-90 transition-all text-sm font-semibold shadow-lg shadow-accent/20"
                 >
                   Save
                 </button>
               </div>
            </div>
        )}

        {post.text && !isEditing && (
            <p className="text-ink leading-relaxed text-lg font-medium tracking-tight whitespace-pre-wrap">
              {post.text.split(/(\s+)/).map((part, index) => {
                if (part.startsWith('#')) {
                  const tag = part.substring(1).replace(/[.,!?;:]+$/, ''); // Remove trailing punctuation
                  return (
                    <Link
                      key={index}
                      to={`/feed?tag=${tag}`}
                      className="text-button hover:underline transition-all font-black decoration-2 underline-offset-4"
                    >
                      {part}
                    </Link>
                  );
                }
                return part;
              })}
            </p>
        )}

        {post.image && (
            <div className="rounded-[24px] overflow-hidden border border-accent/20 bg-surface mt-4 max-h-[500px] shadow-lg">
                <img 
                    src={resolveMediaUrl(post.image)} 
                    alt="Post content" 
                    className="w-full max-h-[500px] object-contain bg-surface"
                />
            </div>
        )}

        {post.video && (
            <div className="rounded-[24px] overflow-hidden border border-accent/20 bg-surface mt-4 shadow-lg relative group/video">
                <video 
                    ref={videoRef}
                    src={resolveMediaUrl(post.video)} 
                    controls 
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    className="w-full max-h-[500px] object-contain bg-black/5"
                />
                <div className="flex items-center justify-between gap-3 border-t border-accent/10 bg-white/75 px-4 py-3">
                    <button
                        type="button"
                        onClick={toggleVideoPlayback}
                        className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-ink transition-colors hover:bg-panel"
                    >
                        {isVideoPlaying ? <Pause size={16} /> : <Play size={16} />}
                        {isVideoPlaying ? 'Pause' : 'Play'}
                    </button>
                    <a
                        href={resolveMediaUrl(post.video)}
                        download
                        className="inline-flex items-center gap-2 rounded-xl bg-button px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-button/20 transition-all hover:brightness-105"
                    >
                        <Download size={16} />
                        Download
                    </a>
                </div>
            </div>
        )}

        {post.document && (
            <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-accent/20 mt-4 hover:border-accent/40 transition-all">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/15 rounded-xl text-primary">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-ink truncate max-w-[150px] sm:max-w-[300px]">
                            {post.document.split('/').pop()}
                        </p>
                        <p className="text-[10px] text-ink/60 uppercase font-black tracking-widest">Shared Document</p>
                    </div>
                </div>
                <a 
                    href={resolveMediaUrl(post.document)} 
                    download 
                    className="p-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                    <Download size={18} />
                </a>
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-accent/15">
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2.5 transition-all py-2 px-3 rounded-xl group/like
              ${isLiked ? 'text-red-500 bg-red-500/10' : 'text-ink/60 hover:text-primary hover:bg-primary/10'}
            `}
          >
            <motion.div
                animate={isLiked ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
            >
                <Heart 
                    size={22} 
                    fill={isLiked ? "currentColor" : "none"} 
                    strokeWidth={isLiked ? 0 : 2} 
                    className={isLiking ? 'animate-pulse' : 'group-hover/like:scale-110 transition-transform'}
                />
            </motion.div>
            <span className="font-bold text-sm">{post.likes || 0}</span>
          </button>

          <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2.5 transition-all py-2 px-3 rounded-xl
                    ${showComments ? 'text-primary bg-primary/10' : 'text-ink/60 hover:bg-primary/10'}
                `}
          >
            <MessageCircle size={22} />
            <span className="font-bold text-sm">{post.comments?.length || 0}</span>
          </button>
        </div>

        <button 
          onClick={handleShare}
          className="text-accent hover:bg-accent/10 p-2 rounded-xl transition-all group"
          title="Share Post"
        >
          <Share2 size={22} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
            <MotionDiv
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="pt-8 mt-6 border-t border-white/5">
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {post.comments?.map((comment, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0 overflow-hidden">
                                    {comment.user?.profilePic ? (
                                        <img src={resolveMediaUrl(comment.user.profilePic)} className="w-full h-full object-cover" alt={comment.user.name} />
                                    ) : (
                                        <User size={16} />
                                    )}
                                </div>
                                <div className="flex-1 bg-background rounded-2xl rounded-tl-none p-4 border border-primary/10">
                                    <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-1">
                                        {comment.user?.name || 'User'}
                                    </p>
                                    <p className="text-sm text-ink/90 font-medium">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                        {(!post.comments || post.comments.length === 0) && (
                            <p className="text-center text-ink/60 text-sm font-medium py-4">No comments yet. Be the first!</p>
                        )}
                    </div>

                    {isAuthenticated && (
                        <form onSubmit={handleCommentSubmit} className="relative flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="input-field h-12 px-5 pr-14 text-sm font-semibold"
                            />
                            <button 
                                type="submit"
                                className="absolute right-2 p-2 text-accent hover:bg-accent/10 rounded-xl transition-all"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    )}
                </div>
            </MotionDiv>
        )}
      </AnimatePresence>
    </MotionDiv>
  );
};

export default PostCard;
