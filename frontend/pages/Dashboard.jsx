import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, RefreshCw, Sparkles, TrendingUp, Users, UsersRound, WandSparkles, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getAvatarUrl, resolveMediaUrl } from '../services/media';

const buildProfileDraft = (user) => ({
  department: user?.department || '',
  year: user?.year || '',
  section: user?.section || '',
  skills: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
  strengths: Array.isArray(user?.strengths) ? user.strengths.join(', ') : '',
  interests: Array.isArray(user?.interests) ? user.interests.join(', ') : '',
});

const Dashboard = () => {
  const { posts, loading, fetchPosts } = usePosts();
  const { user, isAuthenticated, toggleFollow, updateProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [profileDraft, setProfileDraft] = useState(buildProfileDraft(user));
  const [trending, setTrending] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tag = searchParams.get('tag') || '';
  const MotionDiv = motion.div;

  const profileNeedsSetup = useMemo(() => (
    !user?.department || !user?.section || !user?.skills?.length || !user?.strengths?.length
  ), [user]);

  const fetchRecommendations = async () => {
    if (!isAuthenticated) {
      setRecommendations([]);
      setLoadingRecommendations(false);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const { data } = await api.get('/users/recommendations');
      setRecommendations(data?.recommendations || []);
      if (data?.onboardingRecommended || profileNeedsSetup) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    setProfileDraft(buildProfileDraft(user));
  }, [user]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await api.get('/posts/trending');
        setTrending((data || []).slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch trending', error);
      }
    };

    const fetchGroups = async () => {
      try {
        const { data } = await api.get('/groups');
        setGroups((data || []).slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch groups', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchTrending();
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated, user?._id, user?.department, user?.section, user?.skills?.length, user?.strengths?.length]);

  useEffect(() => {
    fetchPosts(1, tag);
  }, [fetchPosts, tag]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPosts(1, tag), fetchRecommendations()]);
    setIsRefreshing(false);
  };

  const handleOnboardingSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      department: profileDraft.department.trim(),
      year: profileDraft.year.trim(),
      section: profileDraft.section.trim(),
      skills: profileDraft.skills.split(',').map((item) => item.trim()).filter(Boolean),
      strengths: profileDraft.strengths.split(',').map((item) => item.trim()).filter(Boolean),
      interests: profileDraft.interests.split(',').map((item) => item.trim()).filter(Boolean),
    };

    if (!payload.department || !payload.section || payload.skills.length === 0 || payload.strengths.length === 0) {
      toast.error('Please fill department, section, skills, and strengths to get better recommendations.');
      return;
    }

    setSavingOnboarding(true);
    const result = await updateProfile(payload);
    setSavingOnboarding(false);

    if (result.success) {
      toast.success('Profile updated. Recommendations are now sharper.');
      setShowOnboarding(false);
      await fetchRecommendations();
    } else {
      toast.error(result.message || 'Could not save your profile setup');
    }
  };

  if (loading && posts.length === 0) {
    return <Loader fullPage />;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 xl:gap-8 items-start">
        <div className="min-w-0">
          <MotionDiv
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 sm:p-7 lg:p-8 mb-6 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-panel/45 pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] font-extrabold text-accent mb-4">
                  <Sparkles size={14} />
                  Active Workspace
                </div>
                <h1 className="text-3xl sm:text-[2.6rem] leading-none font-extrabold tracking-tight text-ink text-balance">
                  {tag ? `Discover #${tag}` : 'Campus conversations, shaped for momentum.'}
                </h1>
                <p className="mt-4 max-w-2xl text-sm sm:text-[15px] leading-7 font-semibold text-muted">
                  {tag
                    ? `You're viewing tagged posts around #${tag}. Follow the signal, meet people working on the same topic, and jump into the right conversation.`
                    : 'Keep tabs on student work, event chatter, study groups, and the people worth meeting next. UniLink should feel useful the second you land here.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/create" className="btn-primary text-xs font-extrabold uppercase tracking-[0.2em]">
                    Share Update
                  </Link>
                  {tag ? (
                    <Link to="/feed" className="btn-secondary text-xs font-extrabold uppercase tracking-[0.18em]">
                      Clear Filter
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowOnboarding(true)}
                      className="btn-secondary text-xs font-extrabold uppercase tracking-[0.18em]"
                    >
                      Improve Matches
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-[190px]">
                {[
                  { label: 'Posts', value: String(posts.length).padStart(2, '0') },
                  { label: 'Matches', value: String(recommendations.length).padStart(2, '0') },
                  { label: 'Tags', value: String(trending.length).padStart(2, '0') },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/72 px-4 py-4 shadow-[0_10px_24px_rgba(31,41,55,0.05)]">
                    <p className="text-[10px] uppercase tracking-[0.22em] font-extrabold text-muted">{item.label}</p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="glass-card p-5 sm:p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 min-w-0">
                <img src={getAvatarUrl(user)} alt={user?.name || 'Your profile'} className="h-14 w-14 rounded-[20px] object-cover ring-1 ring-border/80" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted">Post to Feed</p>
                  <p className="mt-1 text-base sm:text-lg font-extrabold tracking-tight text-ink truncate">
                    Share a campus update, project win, or helpful resource
                  </p>
                </div>
              </Link>

              <div className="sm:ml-auto flex flex-col sm:flex-row gap-3">
                <Link to="/create" className="btn-primary text-xs font-extrabold uppercase tracking-[0.18em]">
                  Create Feed Post
                </Link>
                <Link to="/profile" className="btn-secondary text-xs font-extrabold uppercase tracking-[0.18em]">
                  Update Profile
                </Link>
              </div>
            </div>
          </MotionDiv>

          <div className="flex items-center justify-between gap-4 mb-4 px-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted">Feed</p>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink mt-1">
                {tag ? `Posts tagged with #${tag}` : 'Latest from your network'}
              </h2>
            </div>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-border/90 bg-white/75 px-4 py-3 text-sm font-bold text-ink hover:bg-white transition-colors shadow-[0_10px_20px_rgba(31,41,55,0.05)]"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-primary' : 'text-primary'} />
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {Array.isArray(posts) && posts.map((post) => <PostCard key={post._id} post={post} />)}
            </AnimatePresence>

            {(!posts || posts.length === 0) && !loading && (
              <MotionDiv initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 sm:p-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-panel text-primary shadow-[0_14px_28px_rgba(31,41,55,0.06)]">
                  <UsersRound size={34} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">No posts yet</h3>
                <p className="mt-3 max-w-lg mx-auto text-sm sm:text-base leading-7 font-semibold text-muted text-balance">
                  The feed is ready. The first great post, project update, or event note just has not landed yet.
                </p>
                <Link to="/create" className="btn-primary mt-7 text-xs font-extrabold uppercase tracking-[0.18em]">
                  Publish First Post
                </Link>
              </MotionDiv>
            )}
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="glass-card p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted">Signals</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Trending Now
                </h3>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Sparkles size={16} />
              </div>
            </div>

            <div className="space-y-3">
              {trending.length > 0 ? trending.map((item) => (
                <Link
                  to={`/feed?tag=${item.tag.replace('#', '')}`}
                  key={item.tag}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/70 px-4 py-3 hover:border-primary/20 hover:bg-white transition-colors"
                >
                  <div>
                    <p className="text-sm font-extrabold text-ink">{item.tag}</p>
                    <p className="text-[11px] font-semibold text-muted">Active campus topic</p>
                  </div>
                  <span className="rounded-xl bg-panel px-3 py-2 text-xs font-extrabold text-primary">{item.count}</span>
                </Link>
              )) : (
                <p className="text-sm font-medium text-muted leading-6">Trending tags will appear here once students start posting and engaging.</p>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted">Recommendations</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Suggested Friends
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {loadingRecommendations ? (
                <p className="text-sm font-medium text-muted">Building suggestions from your skills, section, strengths, and mutual network.</p>
              ) : recommendations.length > 0 ? recommendations.map((peer) => {
                const isFollowing = (user?.following || []).some((id) => {
                  const followId = id?._id ? String(id._id) : String(id);
                  return followId === String(peer._id);
                });

                return (
                  <div key={peer._id} className="rounded-2xl border border-border/70 bg-white/72 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Link to={`/profile/${peer._id}`} className="shrink-0">
                        <img src={getAvatarUrl(peer)} alt={peer.name} className="w-12 h-12 rounded-2xl object-cover ring-1 ring-border/70" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/profile/${peer._id}`} className="block">
                          <p className="text-sm font-extrabold text-ink truncate">{peer.name}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted mt-1 truncate">
                            {peer.department || 'Student'}{peer.section ? ` • ${peer.section}` : ''}
                          </p>
                        </Link>
                        <p className="mt-2 text-xs font-medium text-ink/68 leading-5 line-clamp-2">
                          {peer.recommendationReason || peer.bio || 'Promising match from your campus network.'}
                        </p>
                      </div>
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={() => toggleFollow(peer._id)}
                        className={[
                          'mt-4 w-full rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] transition-colors',
                          isFollowing
                            ? 'bg-panel text-ink border border-border/70 hover:bg-white'
                            : 'bg-primary text-white shadow-[0_12px_24px_rgba(201,107,28,0.22)] hover:brightness-105',
                        ].join(' ')}
                      >
                        {isFollowing ? 'Connected' : 'Connect'}
                      </button>
                    )}
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-border bg-white/55 px-4 py-5">
                  <p className="text-sm font-semibold text-muted leading-6">
                    Add your department, section, skills, and strengths to unlock better recommendations.
                  </p>
                  <button onClick={() => setShowOnboarding(true)} className="btn-secondary mt-4 w-full text-xs font-extrabold uppercase tracking-[0.18em]">
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted">Communities</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink">Where people are gathering</h3>
              </div>
            </div>

            <div className="space-y-3">
              {loadingGroups ? (
                <p className="text-sm font-medium text-muted">Pulling the most active communities into view.</p>
              ) : groups.length > 0 ? groups.map((group) => (
                <Link
                  to={`/groups/${group._id}`}
                  key={group._id}
                  className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/72 px-4 py-4 hover:bg-white transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-panel flex items-center justify-center text-primary shrink-0">
                    {group.image ? (
                      <img src={resolveMediaUrl(group.image)} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-ink truncate">{group.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted mt-1">
                      {group.members?.length || 0} members
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-primary shrink-0" />
                </Link>
              )) : (
                <p className="text-sm font-medium text-muted">No groups available yet. Create one and shape the first community yourself.</p>
              )}
            </div>

            <Link to="/groups" className="btn-primary mt-5 w-full text-xs font-extrabold uppercase tracking-[0.18em]">
              Discover More
            </Link>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
              onClick={() => !profileNeedsSetup && setShowOnboarding(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="relative glass-card w-full max-w-2xl p-7 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-primary/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] font-extrabold text-primary">
                    <WandSparkles size={14} />
                    Recommendation setup
                  </div>
                  <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Tell UniLink who should show up in your circle</h3>
                  <p className="mt-2 text-sm leading-7 font-semibold text-muted">
                    We use your section, skills, strengths, and department to suggest better friendship and collaboration connections.
                  </p>
                </div>
                {!profileNeedsSetup && (
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white/70 text-muted hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <input
                    value={profileDraft.department}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, department: event.target.value }))}
                    placeholder="Department"
                    className="input-field"
                  />
                  <input
                    value={profileDraft.year}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, year: event.target.value }))}
                    placeholder="Year"
                    className="input-field"
                  />
                  <input
                    value={profileDraft.section}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, section: event.target.value }))}
                    placeholder="Section"
                    className="input-field"
                  />
                </div>

                <input
                  value={profileDraft.skills}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, skills: event.target.value }))}
                  placeholder="Skills, comma separated"
                  className="input-field"
                />
                <input
                  value={profileDraft.strengths}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, strengths: event.target.value }))}
                  placeholder="Strengths / abilities, comma separated"
                  className="input-field"
                />
                <input
                  value={profileDraft.interests}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, interests: event.target.value }))}
                  placeholder="Interests, comma separated"
                  className="input-field"
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="submit" disabled={savingOnboarding} className="btn-primary flex-1 text-xs font-extrabold uppercase tracking-[0.18em]">
                    {savingOnboarding ? 'Saving profile...' : 'Save and get recommendations'}
                  </button>
                  {!profileNeedsSetup && (
                    <button type="button" onClick={() => setShowOnboarding(false)} className="btn-secondary flex-1 text-xs font-extrabold uppercase tracking-[0.18em]">
                      Maybe later
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
