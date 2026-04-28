import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, Lock, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const MotionDiv = motion.div;

  // If already logged in as admin, redirect immediately
  React.useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // After login, check role from the updated user state
        // We need to re-read from localStorage since state may not update immediately
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser.role === 'admin') {
          toast.success('Welcome, Admin! 🛡️');
          navigate('/admin/dashboard');
        } else {
          // Logged in but not admin — logout and show error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Access denied. Admin privileges required.');
        }
      } else {
        toast.error(result.message || 'Invalid credentials');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="glass-card overflow-hidden">
          {/* Header Banner */}
          <div className="bg-button p-12 flex flex-col items-center justify-center text-white relative overflow-hidden">
            <MotionDiv
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
            <Shield size={52} className="mb-4 drop-shadow-xl" />
            <h1 className="text-4xl font-black drop-shadow-sm">Admin Portal</h1>
            <p className="text-white/90 font-medium text-sm mt-1">UniLink Administration</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink/70 uppercase tracking-widest px-1">
                  Admin Email
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-button group-focus-within:text-button transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@university.edu"
                    className="input-field pl-12 pr-4 py-4"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink/70 uppercase tracking-widest px-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-button group-focus-within:text-button transition-colors"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-12 pr-12 py-4"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-button/60 hover:text-button transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-widest text-sm bg-button hover:bg-button/90 text-white shadow-lg shadow-button/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <Shield size={20} />
              {isSubmitting ? 'Verifying...' : 'Access Admin Panel'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-ink/60 text-sm font-medium hover:text-accent transition-all"
              >
                <ArrowLeft size={16} />
                Back to regular login
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-ink/40 mt-4 font-medium">
          🔒 This area is restricted to authorised administrators only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
