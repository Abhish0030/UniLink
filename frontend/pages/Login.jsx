import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Eye, EyeOff, Lock, LogIn, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/unilink-lamp.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(`Welcome back ${result.name || ''}!`);
        navigate('/feed');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto min-h-[calc(100vh-4rem)] grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
        <section className="glass-card relative overflow-hidden p-8 sm:p-10 lg:p-14 flex flex-col justify-between min-h-[320px]">
          <div className="absolute inset-0 bg-panel/45 pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] font-extrabold text-accent">
              <Sparkles size={14} />
              Professional student network
            </div>
            <div className="mt-8 max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.28em] font-extrabold text-muted">UniLink Access</p>
              <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl leading-none font-extrabold tracking-tight text-ink text-balance">
                Get back to the campus conversations that matter.
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-8 font-semibold text-muted">
                Projects, peers, communities, and direct messages live in one focused workspace built for university life.
              </p>
            </div>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-3 mt-10">
            {[
              { label: 'Peers', value: 'Connect with builders' },
              { label: 'Groups', value: 'Find active communities' },
              { label: 'Feed', value: 'Track campus momentum' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/64 px-4 py-4 shadow-[0_12px_26px_rgba(31,41,55,0.06)]">
                <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted">{item.label}</p>
                <p className="mt-2 text-sm font-bold text-ink/78 leading-6">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-primary shadow-[0_14px_28px_rgba(31,41,55,0.07)] overflow-hidden border border-border/70">
              <img src={brandLogo} alt="UniLink logo" className="h-11 w-11 object-contain" />
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-3 text-sm sm:text-base font-semibold text-muted leading-7">
              Sign in to continue your student profile, messages, and campus feed.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted mb-2 px-1">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@university.edu"
                  className="input-field pl-12 py-4"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted mb-2 px-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-12 pr-12 py-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-sm font-extrabold uppercase tracking-[0.18em] flex items-center justify-center gap-3"
            >
              <LogIn size={18} />
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <p className="font-semibold text-muted">
              New here?{' '}
              <Link to="/register" className="font-extrabold text-primary hover:text-ink transition-colors">
                Create your account
              </Link>
            </p>
            <Link to="/admin/login" className="inline-flex items-center gap-2 font-extrabold text-accent hover:text-ink transition-colors">
              Admin login
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
