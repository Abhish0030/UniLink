import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Edit3, MapPin, Calendar, Grid, Bookmark, MessageSquare,
  X, Save, UserPlus, UserMinus, Users, Camera, GraduationCap,
  Briefcase, Heart, Star, Award, UserCheck, Sparkles, PlusCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import ImageCropModal from '../components/ImageCropModal';
import { resolveMediaUrl } from '../services/media';

const MotionDiv = motion.div;

// ─────────────────────────────────────────────
// Skeleton loader for banner + avatar area
// ─────────────────────────────────────────────
const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-56 bg-accent/20 rounded-t-3xl" />
    <div className="px-8 pb-8 -mt-14 flex flex-col gap-4">
      <div className="w-28 h-28 rounded-full bg-accent/30 border-4 border-surface" />
      <div className="h-6 w-48 bg-accent/20 rounded-xl" />
      <div className="h-4 w-64 bg-accent/10 rounded-xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Tag chip component
// ─────────────────────────────────────────────
const Tag = ({ label, color = 'accent' }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${color}/15 text-${color === 'accent' ? 'ink' : 'ink'} border border-${color}/30`}>
    {label}
  </span>
);

// ─────────────────────────────────────────────
// Stat block
// ─────────────────────────────────────────────
const Stat = ({ value, label }) => (
  <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-background/30">
    <span className="text-2xl font-black text-ink">{value}</span>
    <span className="text-xs font-bold text-ink/60 uppercase tracking-widest">{label}</span>
  </div>
);

// ─────────────────────────────────────────────
// Main Profile Component
// ─────────────────────────────────────────────
const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveChat } = useChat();
  const { user: currentUser, updateProfile, updateProfilePic, updateBanner, toggleFollow, refreshUser, isAuthenticated } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropConfig, setCropConfig] = useState(null);

  const profilePicInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const sliderRef = useRef(null);

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const isOwnProfile = !id || (currentUser && id === currentUser._id);
  const user = isOwnProfile ? currentUser : profileUser;

  // Normalise IDs to strings for reliable comparison
  const isFollowing = (() => {
    if (!currentUser || !user) return false;
    const followingIds = (currentUser.following || []).map(i =>
      i?._id ? String(i._id) : String(i)
    );
    const targetId = user?._id ? String(user._id) : '';
    return followingIds.includes(targetId);
  })();

  // Social graph modal state
  const [socialModal, setSocialModal] = useState(null); // 'followers' | 'following' | null
  const [socialList, setSocialList] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [followingState, setFollowingState] = useState({}); // { [userId]: bool }

  // Edit form state
  const [formData, setFormData] = useState({
    name: '', bio: '', department: '', section: '', year: '', skills: '', strengths: '', interests: ''
  });

  // ── Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        if (isOwnProfile && currentUser) {
          const { data } = await api.get('/posts/my/all');
          setPosts(data);
          setFormData({
            name: currentUser.name || '',
            bio: currentUser.bio || '',
            department: currentUser.department || '',
            section: currentUser.section || '',
            year: currentUser.year || '',
            skills: currentUser.skills?.join(', ') || '',
            strengths: currentUser.strengths?.join(', ') || '',
            interests: currentUser.interests?.join(', ') || ''
          });
        } else if (id) {
          const [{ data: fetchedUser }, { data: userPosts }] = await Promise.all([
            api.get(`/users/${id}`),
            api.get(`/posts/user/${id}`)
          ]);
          setProfileUser(fetchedUser);
          setPosts(userPosts || []);
        }
      } catch {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [id, currentUser, isOwnProfile]);

  // Sync form when currentUser changes
  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        department: currentUser.department || '',
        section: currentUser.section || '',
        year: currentUser.year || '',
        skills: currentUser.skills?.join(', ') || '',
        strengths: currentUser.strengths?.join(', ') || '',
        interests: currentUser.interests?.join(', ') || ''
      });
    }
  }, [currentUser, isOwnProfile]);

  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (isOwnProfile && isAuthenticated) {
        setRecsLoading(true);
        try {
          const { data } = await api.get('/users/recommendations');
          setRecommendations(data?.recommendations || []);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        } finally {
          setRecsLoading(false);
        }
      }
    };
    fetchRecommendations();
  }, [isOwnProfile, isAuthenticated]);

  // ── Handle Profile Pic Upload
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCropConfig({
      kind: 'profile',
      file,
      title: 'Crop profile picture',
      aspect: 1,
      cropShape: 'round',
      outputWidth: 900,
      initialZoom: 1.2,
    });
  };

  // ── Handle Banner Upload
  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCropConfig({
      kind: 'banner',
      file,
      title: 'Crop banner image',
      aspect: 3 / 1,
      outputWidth: 1800,
      initialZoom: 1.05,
    });
  };

  const handleCropComplete = async (file) => {
    const activeCrop = cropConfig;
    setCropConfig(null);

    if (!activeCrop) return;

    if (activeCrop.kind === 'profile') {
      setUploadingProfilePic(true);
      const result = await updateProfilePic(file);
      setUploadingProfilePic(false);
      if (result.success) {
        toast.success('Profile picture updated!');
      } else {
        toast.error(result.message || 'Upload failed');
      }
      return;
    }

    if (activeCrop.kind === 'banner') {
      setUploadingBanner(true);
      const result = await updateBanner(file);
      setUploadingBanner(false);
      if (result.success) {
        toast.success('Banner updated!');
      } else {
        toast.error(result.message || 'Upload failed');
      }
    }
  };

  // ── Handle Edit Profile Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updatedData = {
      ...formData,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      strengths: formData.strengths ? formData.strengths.split(',').map(s => s.trim()).filter(Boolean) : [],
      interests: formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(Boolean) : []
    };
    const result = await updateProfile(updatedData);
    setSaving(false);
    if (result.success) {
      toast.success('Profile updated! ');
      setIsEditModalOpen(false);
    } else {
      toast.error(result.message || 'Update failed');
    }
  };

  // ── Handle Follow/Unfollow
  const handleFollow = async () => {
    if (!isAuthenticated || !user) return toast.info('Please login to follow users');

    const targetUserId = String(user._id);
    const currentUserId = String(currentUser._id);
    const wasFollowing = isFollowing;

    // Optimistic update for the profile being viewed (target user)
    // currentUser.following is already optimistically updated by toggleFollow()
    if (profileUser) {
      setProfileUser(prev => ({
        ...prev,
        followers: wasFollowing
          ? (prev.followers || []).filter(fid => (fid?._id ? String(fid._id) : String(fid)) !== currentUserId)
          : [...(prev.followers || []), currentUserId]
      }));
    }

    const result = await toggleFollow(user._id);

    if (result.success) {
      toast.success(result.isNowFollowing ? 'Following! ' : 'Unfollowed');
      // The backend returns exact counts, let's sync them to be 100% sure
      if (profileUser) {
        setProfileUser(prev => ({
          ...prev,
          followers: result.isNowFollowing
            ? [...(prev.followers || [])].filter((v, i, a) => a.indexOf(v) === i) // unique
            : prev.followers
        }));
      }
    } else {
      // Rollback on error
      if (profileUser) {
        setProfileUser(prev => ({
          ...prev,
          followers: wasFollowing
            ? [...(prev.followers || []), currentUserId]
            : (prev.followers || []).filter(fid => (fid?._id ? String(fid._id) : String(fid)) !== currentUserId)
        }));
      }
      toast.error(result.message);
    }
  };

  // ── Open followers / following modal
  const openSocialModal = async (type) => {
    setSocialModal(type);
    setSocialList([]);
    setSocialLoading(true);
    try {
      // Use dedicated populated endpoints — single DB query, no N+1
      const targetId = user?._id ? String(user._id) : null;
      if (!targetId) { setSocialLoading(false); return; }

      const endpoint = type === 'followers'
        ? `/users/${targetId}/followers`
        : `/users/${targetId}/following`;

      const { data: results } = await api.get(endpoint);
      setSocialList(results);

      // Initialise follow states for each user in the list
      const states = {};
      const myFollowing = (currentUser?.following || []).map(i =>
        i?._id ? String(i._id) : String(i)
      );
      results.forEach(u => {
        states[u._id] = myFollowing.includes(String(u._id));
      });
      setFollowingState(states);
    } catch {
      toast.error('Could not load list');
    } finally {
      setSocialLoading(false);
    }
  };

  // ── Follow toggle inside the social modal
  const handleModalFollow = async (targetUser) => {
    if (!isAuthenticated) return toast.info('Please login');
    const result = await toggleFollow(targetUser._id);
    if (result.success) {
      setFollowingState(prev => ({ ...prev, [targetUser._id]: result.isNowFollowing }));
    } else {
      toast.error(result.message);
    }
  };

  // ── Avatar URL helper
  const getProfilePicUrl = (u) => {
    if (!u) return '';
    if (u.profilePic) {
      return resolveMediaUrl(u.profilePic);
    }
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(u.name || 'user')}&backgroundColor=ffd5dc,b6e3f4,c0aede`;
  };

  // ── Banner URL helper
  const getBannerUrl = (u) => {
    if (!u?.bannerImage) return null;
    return resolveMediaUrl(u.bannerImage);
  };

  // ── Format join date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently joined';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  if (loading && !user) return <Loader fullPage />;
  if (!user) return (
    <div className="p-20 text-center">
      <h2 className="text-2xl font-bold text-primary">User Not Found</h2>
    </div>
  );

  const bannerUrl = getBannerUrl(user);
  const profilePicUrl = getProfilePicUrl(user);
  const followersCount = user?.followers?.length || 0;
  const followingCount = user?.following?.length || 0;
  const postsCount = posts.length;

  return (
    <>
      {cropConfig && (
        <ImageCropModal
          config={cropConfig}
          onCancel={() => setCropConfig(null)}
          onComplete={handleCropComplete}
        />
      )}
      <div className="max-w-4xl mx-auto py-8 px-4">

      {/* ── Profile Card ── */}
      <div className="glass-card overflow-hidden shadow-2xl mb-8 border border-white/10">

        {/* ── BANNER ── */}
        <div className="relative h-64 overflow-hidden group/banner">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Profile Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-button/90 relative overflow-hidden">
              <MotionDiv
                animate={{ rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
              <MotionDiv
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl"
              />
            </div>
          )}

          {/* Banner upload overlay — own profile only */}
          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full text-sm font-black backdrop-blur-md border border-white/30 transition-all active:scale-95 disabled:opacity-60 shadow-xl"
                >
                  {uploadingBanner ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Uploading…
                    </span>
                  ) : (
                    <>
                      <Camera size={18} />
                      Update Banner
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── PROFILE BODY ── */}
        <div className="px-6 md:px-10 pb-10 relative">

          {/* Avatar row */}
          <div className="flex flex-col md:flex-row items-end md:items-start gap-6 -mt-16 mb-6">

            {/* Avatar */}
            <div className="relative flex-shrink-0 group/avatar">
              <div
                className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] border-surface shadow-2xl overflow-hidden bg-surface transition-all duration-500 group-hover/avatar:scale-[1.02] ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={() => isOwnProfile && profilePicInputRef.current?.click()}
              >
                <img
                  src={profilePicUrl}
                  alt={user?.name}
                  className="w-full h-full object-cover group-hover/avatar:brightness-90 transition-all duration-300"
                />

                {/* Hover overlay for upload */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    {uploadingProfilePic ? (
                      <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera size={28} className="text-white" />
                        <span className="text-[10px] text-white font-black uppercase tracking-tighter">Change</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden file input for avatar */}
              {isOwnProfile && (
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              )}

              {/* Camera badge small */}
              {isOwnProfile && !uploadingProfilePic && (
                <button
                  onClick={() => profilePicInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-2.5 bg-button text-white rounded-full shadow-2xl ring-4 ring-surface hover:scale-110 active:scale-95 transition-all md:hidden"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>

            {/* Spacer on md+ */}
            <div className="hidden md:flex-1 md:block" />
          </div>

          {/* Name & meta */}
          <div className="mt-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-black text-ink tracking-tight">{user?.name}</h1>
                  {user?.role === 'admin' && (
                    <span className="bg-button/20 text-button text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-button/30">Admin</span>
                  )}
                </div>
                <p className="text-ink/50 font-bold mt-1 text-sm">{user?.email}</p>
              </div>

              <div className="flex flex-wrap gap-3 self-start">
                {!isOwnProfile && (
                  <button
                    onClick={() => {
                      setActiveChat(user);
                      navigate('/messages');
                    }}
                    className="px-6 py-3 rounded-2xl font-black shadow-xl transition-all flex items-center gap-2 active:scale-95 text-sm bg-accent/10 text-ink border border-accent/20 hover:bg-accent/20"
                  >
                    <MessageSquare size={18} />
                    Message
                  </button>
                )}
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn-primary px-8 py-3 shadow-xl shadow-button/25 flex items-center gap-2 text-sm font-black tracking-wide"
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`px-8 py-3 rounded-2xl font-black shadow-xl transition-all flex items-center gap-2 active:scale-95 text-sm ${isFollowing
                        ? 'bg-accent/10 text-ink border border-accent/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-300'
                        : 'bg-button text-white shadow-button/20 hover:brightness-105'
                      }`}
                  >
                    {isFollowing ? <><UserMinus size={18} /> Unfollow</> : <><UserPlus size={18} /> Follow</>}
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {user?.bio ? (
              <p className="mt-5 text-ink/80 leading-relaxed text-lg font-medium max-w-2xl bg-black/5 p-4 rounded-2xl border border-white/5">
                {user.bio}
              </p>
            ) : isOwnProfile ? (
              <p className="mt-5 text-ink/40 italic cursor-pointer hover:text-ink/60 transition-colors" onClick={() => setIsEditModalOpen(true)}>
                Add a bio to tell your story…
              </p>
            ) : null}

            {/* Department, Year, Join Date */}
            <div className="flex flex-wrap items-center gap-6 mt-6">
              {user?.department && (
                <div className="flex items-center gap-2 text-ink/70 text-sm font-bold bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10">
                  <GraduationCap size={18} className="text-accent" />
                  {user.department}
                </div>
              )}
              {user?.section && (
                <div className="flex items-center gap-2 text-ink/70 text-sm font-bold bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10">
                  <MapPin size={18} className="text-accent" />
                  Section {user.section}
                </div>
              )}
              {user?.year && (
                <div className="flex items-center gap-2 text-ink/70 text-sm font-bold bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10">
                  <Briefcase size={18} className="text-accent" />
                  Year {user.year}
                </div>
              )}
              <div className="flex items-center gap-2 text-ink/70 text-sm font-bold">
                <Calendar size={18} className="text-accent/60" />
                Joined {formatDate(user?.createdAt)}
              </div>
            </div>

            {/* Stats row — clickable */}
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <Stat value={postsCount} label="Posts" />
              <button onClick={() => openSocialModal('followers')} className="focus:outline-none hover:scale-105 transition-transform">
                <Stat value={followersCount} label="Followers" />
              </button>
              <button onClick={() => openSocialModal('following')} className="focus:outline-none hover:scale-105 transition-transform">
                <Stat value={followingCount} label="Following" />
              </button>
            </div>

            {/* Skills & Interests in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Skills */}
              {user?.skills?.length > 0 && (
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-button" />
                    <span className="text-xs font-black uppercase tracking-widest text-ink/60">Skills & Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-button/10 border border-button/20 text-ink text-xs font-bold rounded-2xl hover:bg-button/20 transition-colors">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user?.strengths?.length > 0 && (
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} className="text-accent" />
                    <span className="text-xs font-black uppercase tracking-widest text-ink/60">Strengths & Abilities</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.strengths.map((strength, i) => (
                      <span key={i} className="px-4 py-2 bg-accent/10 border border-accent/20 text-ink text-xs font-bold rounded-2xl hover:bg-accent/20 transition-colors">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {user?.interests?.length > 0 && (
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={16} className="text-pink-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-ink/60">Personal Interests</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, i) => (
                      <span key={i} className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-ink text-xs font-bold rounded-2xl hover:bg-pink-500/20 transition-colors">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div className="border-t border-white/5 flex bg-black/5 backdrop-blur-md">
          {[
            { id: 'posts', icon: Grid, label: 'Posts' },
            { id: 'bookmark', icon: Bookmark, label: 'Saved' },
            { id: 'replies', icon: MessageSquare, label: 'Replies' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-6 font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 overflow-hidden
                ${activeTab === tab.id ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
            >
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <MotionDiv
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-1.5 bg-button rounded-t-full shadow-[0_-4px_10px_rgba(var(--button-rgb),0.5)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: RECOMMENDATIONS ── */}
      {isOwnProfile && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 px-4">
            <h3 className="text-xl font-black text-primary flex items-center gap-3">
              <Sparkles size={24} className="text-primary fill-primary/10" />
              Recommended Students
            </h3>
            <p className="text-xs font-bold text-primary/40 uppercase tracking-[0.2em]">Based on your skills</p>
          </div>

          {recsLoading ? (
            <div className="flex overflow-hidden gap-6 px-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[200px] flex flex-col items-center gap-4 p-6 bg-white border border-primary/5 rounded-[2.5rem] animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-primary/5" />
                  <div className="h-4 bg-primary/5 rounded w-2/3" />
                  <div className="h-3 bg-primary/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="relative group/slider">
              <button 
                onClick={scrollLeft} 
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2 bg-white rounded-full shadow-lg border border-primary/10 text-primary opacity-0 group-hover/slider:opacity-100 transition-opacity hover:scale-110 hidden md:block"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-2 pb-6 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className="min-w-[200px] max-w-[240px] flex-1 snap-start flex flex-col items-center gap-4 p-6 rounded-[3rem] bg-white border border-primary/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative group"
                  >
                  <Link to={`/profile/${rec._id}`} className="flex flex-col items-center gap-4 w-full">
                    <div className="relative p-1 rounded-full bg-primary/20">
                      <img
                        src={getProfilePicUrl(rec)}
                        alt={rec.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="text-center w-full min-w-0">
                      <h4 className="font-bold text-primary truncate w-full">{rec.name}</h4>
                      <p className="text-[10px] text-primary/40 font-black uppercase tracking-widest w-full truncate">
                        {rec.department || 'Student'}{rec.section ? ` • ${rec.section}` : ''}
                      </p>
                    </div>
                  </Link>
                  <p className="text-[11px] leading-5 text-primary/55 text-center min-h-[2.75rem]">
                    {rec.recommendationReason || 'Recommended from your network'}
                  </p>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isAuthenticated) return toast.info('Please login to follow users');

                      setRecommendations(prev => prev.filter(r => r._id !== rec._id));
                      const result = await toggleFollow(rec._id);
                      if (result.success) {
                        toast.success('Linked! 👋');
                      } else {
                        toast.error('Failed to link');
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-primary/10"
                  >
                    Link Up
                  </button>
                </div>
              ))}
              </div>

              <button 
                onClick={scrollRight} 
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2 bg-white rounded-full shadow-lg border border-primary/10 text-primary opacity-0 group-hover/slider:opacity-100 transition-opacity hover:scale-110 hidden md:block"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-[3rem] border border-dashed border-primary/10 mx-2">
              <p className="text-sm text-primary/40 font-bold italic">
                Add more skills to your profile to find better matches!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: POSTS & CONTENT ── */}
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' ? (
            <MotionDiv
              key="posts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
              ) : (
                <div className="glass-card p-24 text-center border-2 border-dashed border-primary/10 rounded-[40px] bg-white/50">
                  <Award size={48} className="mx-auto mb-6 text-primary/10" />
                  <p className="text-primary/40 font-black text-xl uppercase tracking-widest">No posts yet</p>
                  {isOwnProfile && (
                    <p className="text-primary/20 text-sm mt-3 font-medium">Share something amazing with the community!</p>
                  )}
                </div>
              )}
            </MotionDiv>
          ) : (
            <MotionDiv
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-24 text-center border-2 border-dashed border-primary/10 rounded-[40px] bg-white/50"
            >
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8">
                <Sparkles size={40} />
              </div>
              <h3 className="text-2xl font-black text-primary mb-3 uppercase tracking-tight">No content here</h3>
              <p className="text-primary/40 font-medium max-w-sm mx-auto leading-relaxed">
                {isOwnProfile
                  ? "Share your first project, achievement or a simple update with your campus network!"
                  : "This student hasn't shared any content yet. Check back later for updates!"}
              </p>
              {isOwnProfile && (
                <Link to="/create" className="btn-primary mt-8 px-10 py-4 inline-flex items-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20">
                  <PlusCircle size={20} />
                  Create First Post
                </Link>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-xl bg-surface text-ink rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 max-h-[90vh] flex flex-col"
            >
              <div className="p-10 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-ink tracking-tight">Edit Profile</h2>
                    <p className="text-ink/50 font-bold text-sm mt-1">Make your profile stand out</p>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-3 hover:bg-white/5 rounded-2xl transition-colors border border-white/5"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">Display Name</label>
                    <input
                      type="text"
                      className="input-field h-14 px-6 text-lg font-black bg-white/5 border-white/10 focus:border-button/50 transition-all rounded-2xl"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Your Name"
                    />
                  </div>

                  {/* Department & Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">Department</label>
                      <input
                        type="text"
                        className="input-field h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                        placeholder="e.g. Computer Science"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">Section</label>
                      <input
                        type="text"
                        className="input-field h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                        placeholder="e.g. A"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">Year</label>
                      <input
                        type="text"
                        className="input-field h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                        placeholder="e.g. 3rd"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">Bio</label>
                    <textarea
                      rows="4"
                      className="input-field px-6 py-4 font-bold bg-white/5 border-white/10 rounded-2xl resize-none leading-relaxed"
                      placeholder="Tell the world about yourself…"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">
                      Skills <span className="font-bold normal-case opacity-40 ml-1"> (comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      className="input-field h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                      placeholder="React, Node.js, Python…"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">
                      Strengths <span className="font-bold normal-case opacity-40 ml-1"> (comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      className="input-field h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                      placeholder="Leadership, Public Speaking, Fast Learning…"
                      value={formData.strengths}
                      onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    />
                  </div>

                  {/* Interests */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-ink/50 uppercase tracking-[0.2em] px-1">
                      Interests <span className="font-bold normal-case opacity-40 ml-1"> (comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      className="input-field h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                      placeholder="AI/ML, Open Source, Gaming…"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary w-full h-16 font-black uppercase tracking-[0.2em] shadow-2xl shadow-button/40 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-60 rounded-3xl text-lg"
                    >
                      {saving ? (
                        <>
                          <div className="w-6 h-6 border-4 border-ink border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <><Save size={24} /> Save Profile</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── FOLLOWERS / FOLLOWING MODAL ── */}
      <AnimatePresence>
        {socialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSocialModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-md bg-surface text-ink rounded-[40px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-7 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-button" />
                  <h2 className="text-2xl font-black text-ink capitalize tracking-tight">
                    {socialModal}
                  </h2>
                </div>
                <button
                  onClick={() => setSocialModal(null)}
                  className="p-2.5 hover:bg-white/5 rounded-2xl transition-colors border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 p-6 space-y-3 custom-scrollbar">
                {socialLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-button border-t-transparent rounded-full animate-spin" />
                    <p className="text-ink/40 font-black uppercase tracking-widest text-xs">Fetching list…</p>
                  </div>
                ) : socialList.length > 0 ? (
                  socialList.map((socialUser) => (
                    <div key={socialUser._id} className="flex items-center justify-between p-3 rounded-3xl hover:bg-white/5 transition-colors group">
                      <Link
                        to={`/profile/${socialUser._id}`}
                        onClick={() => setSocialModal(null)}
                        className="flex items-center gap-4 flex-1"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden shadow-lg">
                          <img
                            src={getProfilePicUrl(socialUser)}
                            alt={socialUser.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div>
                          <p className="font-black text-ink leading-none">{socialUser.name}</p>
                          <p className="text-xs font-bold text-ink/40 mt-1">{socialUser.department || 'Student'}</p>
                        </div>
                      </Link>

                      {/* Follow toggle button inside list */}
                      {currentUser && socialUser._id !== currentUser._id && (
                        <button
                          onClick={() => handleModalFollow(socialUser)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${followingState[socialUser._id]
                              ? 'bg-accent/10 text-ink border border-accent/20'
                              : 'bg-button text-white shadow-lg shadow-button/20'
                            }`}
                        >
                          {followingState[socialUser._id] ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <Users size={40} className="mx-auto mb-4 text-ink/10" />
                    <p className="text-ink/40 font-black uppercase tracking-widest text-sm">No one here yet</p>
                  </div>
                )}
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default Profile;
