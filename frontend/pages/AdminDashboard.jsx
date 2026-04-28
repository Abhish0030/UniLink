import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users, FileText, Shield, Sparkles, Flame, Search, Trash2, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────
const Avatar = ({ src, name }) =>
    src
        ? <img src={src} alt={name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" />
        : <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {name?.[0]?.toUpperCase() || '?'}
          </div>;

const StatCard = ({ label, value, icon: Icon, colorClass, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group"
    >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none ${colorClass.split(' ')[0]}`} />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} shrink-0 transition-transform group-hover:scale-110`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-[10px] text-ink/40 uppercase tracking-widest font-black mb-0.5">{label}</p>
            <p className="text-2xl font-black text-ink">{value ?? '…'}</p>
        </div>
    </motion.div>
);

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
        onClick={onCancel}
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-card rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
            
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 ring-8 ring-red-500/5">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-ink mb-2">Are you sure?</h3>
                <p className="text-ink/60 text-sm leading-relaxed">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-3 rounded-2xl border border-accent/20 text-sm font-bold text-ink/60 hover:bg-surface hover:text-ink transition-all active:scale-95"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-500/25 hover:bg-red-600 hover:shadow-red-500/40 transition-all active:scale-95"
                >
                    Confirm Delete
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('users');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // ── Fetch data ─────────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
        } catch { /* silently fail */ }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load users');
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/posts');
            setPosts(data.posts || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load posts');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchStats(), fetchUsers(), fetchPosts()])
            .finally(() => setLoading(false));
    }, [fetchStats, fetchUsers, fetchPosts]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const handleDeleteUser = async (id) => {
        try {
            const { data } = await api.delete(`/admin/users/${id}`);
            toast.success(data.message);
            setUsers(prev => prev.filter(u => u._id !== id));
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
        setConfirm(null);
    };

    const handleDeletePost = async (id) => {
        try {
            const { data } = await api.delete(`/admin/posts/${id}`);
            toast.success(data.message);
            setPosts(prev => prev.filter(p => p._id !== id));
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
        setConfirm(null);
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'student' : 'admin';
        try {
            const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toast.success(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Role update failed');
        }
    };

    // ── Filtered lists ─────────────────────────────────────────────────────────
    const filteredUsers = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const filteredPosts = posts.filter(p =>
        (p.text || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.user?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-ink flex items-center gap-2">
                        🛡️ Admin Dashboard
                    </h1>
                    <p className="text-ink/60 text-sm mt-1">Manage users, posts and platform activity</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="text-sm text-primary hover:underline font-bold"
                >
                    ← Back to Feed
                </button>
            </div>

            {/* ── Stats Grid ── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <StatCard label="Total Users"   value={stats.totalUsers}  icon={Users}    colorClass="bg-primary/10 text-primary" delay={0.1} />
                    <StatCard label="Total Posts"   value={stats.totalPosts}  icon={FileText} colorClass="bg-accent/10 text-primary" delay={0.15} />
                    <StatCard label="Admins"         value={stats.totalAdmins} icon={Shield}   colorClass="bg-primary/20 text-primary" delay={0.2} />
                    <StatCard label="New Users (7d)" value={stats.newUsers}   icon={Sparkles} colorClass="bg-accent/20 text-primary" delay={0.25} />
                    <StatCard label="New Posts (7d)" value={stats.newPosts}   icon={Flame}    colorClass="bg-primary/30 text-primary" delay={0.3} />
                </div>
            )}

            {/* ── Tab Bar + Search ── */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center border-b border-accent/20 px-4 pt-4 gap-2">
                    {['users', 'posts'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setSearch(''); }}
                            className={`px-5 py-2 rounded-t-xl text-sm font-semibold transition-colors capitalize ${
                                tab === t
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-ink/60 hover:text-primary hover:bg-background'
                            }`}
                        >
                            {t === 'users' ? `👥 Users (${users.length})` : `📝 Posts (${posts.length})`}
                        </button>
                    ))}

                    <div className="ml-auto flex gap-2 pb-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={tab === 'users' ? 'Search users…' : 'Search posts…'}
                                className="bg-surface border border-primary/30 rounded-xl pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/40 w-44"
                            />
                        </div>
                        {tab === 'users' && (
                            <select
                                value={roleFilter}
                                onChange={e => setRoleFilter(e.target.value)}
                                className="bg-surface border border-primary/30 rounded-xl px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* ── Users Table ── */}
                {tab === 'users' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-ink/50 text-xs uppercase tracking-wider border-b border-accent/20">
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left hidden md:table-cell">Dept / Year</th>
                                    <th className="px-4 py-3 text-left">Role</th>
                                    <th className="px-4 py-3 text-left hidden sm:table-cell">Joined</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-ink/50">
                                            No users found
                                        </td>
                                    </tr>
                                ) : filteredUsers.map(u => (
                                    <tr key={u._id} className="border-b border-accent/10 hover:bg-surface/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar src={u.profilePic} name={u.name} />
                                                <span className="font-semibold text-ink">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-ink/60 text-xs">{u.email}</td>
                                        <td className="px-4 py-3 text-ink/60 hidden md:table-cell">
                                            {u.department || '—'} {u.year ? `· ${u.year}` : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                u.role === 'admin'
                                                    ? 'bg-primary/15 text-primary'
                                                    : 'bg-accent/15 text-ink'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-ink/50 text-xs hidden sm:table-cell">
                                            {new Date(u.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRoleChange(u._id, u.role)}
                                                    title={u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                                                    className="p-1.5 rounded-lg text-xs border border-primary/20 hover:border-primary text-ink/60 hover:text-primary transition-colors"
                                                >
                                                    {u.role === 'admin'
                                                        ? <ArrowDownCircle size={16} />
                                                        : <ArrowUpCircle size={16} />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => setConfirm({ type: 'user', id: u._id, name: u.name })}
                                                    className="p-1.5 rounded-lg text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Posts Table ── */}
                {tab === 'posts' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-ink/50 text-xs uppercase tracking-wider border-b border-accent/20">
                                    <th className="px-4 py-3 text-left">Author</th>
                                    <th className="px-4 py-3 text-left">Content</th>
                                    <th className="px-4 py-3 text-left">Likes</th>
                                    <th className="px-4 py-3 text-left hidden sm:table-cell">Comments</th>
                                    <th className="px-4 py-3 text-left hidden md:table-cell">Posted</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-ink/50">
                                            No posts found
                                        </td>
                                    </tr>
                                ) : filteredPosts.map(p => (
                                    <tr key={p._id} className="border-b border-accent/10 hover:bg-surface/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar src={p.user?.profilePic} name={p.user?.name} />
                                                <span className="font-semibold text-ink">{p.user?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="text-ink/70 truncate">
                                                {p.text || <em className="opacity-50">Media-only post</em>}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-ink/60">{p.likes ?? 0}</td>
                                        <td className="px-4 py-3 text-ink/60 hidden sm:table-cell">
                                            {p.comments?.length ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-ink/50 text-xs hidden md:table-cell">
                                            {new Date(p.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setConfirm({ type: 'post', id: p._id, name: p.text?.slice(0, 30) || 'this post' })}
                                                className="p-1.5 rounded-lg text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                title="Delete post"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Confirm Modal ── */}
            <AnimatePresence>
                {confirm && (
                    <ConfirmModal
                        message={
                            confirm.type === 'user'
                                ? `Delete user "${confirm.name}"? This will also delete all their posts.`
                                : `Delete post "${confirm.name}…"?`
                        }
                        onConfirm={() =>
                            confirm.type === 'user'
                                ? handleDeleteUser(confirm.id)
                                : handleDeletePost(confirm.id)
                        }
                        onCancel={() => setConfirm(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
