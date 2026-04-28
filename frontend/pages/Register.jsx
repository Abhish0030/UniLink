import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/unilink-lamp.svg';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(name, email, password);
      if (result.success) {
        toast.success('Account created successfully. Please log in.');
        navigate('/login');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto min-h-[calc(100vh-4rem)] grid lg:grid-cols-[0.92fr_1.08fr] gap-6">
        <section className="glass-card relative overflow-hidden p-8 sm:p-10 lg:p-14 flex flex-col justify-between">
          <div className="absolute inset-0 bg-panel/45 pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-primary/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] font-extrabold text-primary">
              <Sparkles size={14} />
              Join the network
            </div>
            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-[3.4rem] leading-none font-extrabold tracking-tight text-ink text-balance">
              Build a profile that makes meeting the right people easier.
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-8 font-semibold text-muted">
              Show your department, interests, and work. UniLink is strongest when your presence feels real and discoverable.
            </p>
          </div>

          <div className="relative mt-10 grid gap-3">
            {[
              'Create a professional student profile',
              'Join communities for clubs, labs, and projects',
              'Share posts and start conversations with context',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/70 bg-white/68 px-4 py-4 text-sm font-bold text-ink/80 shadow-[0_12px_24px_rgba(31,41,55,0.05)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-8 sm:p-10 lg:p-12">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-primary shadow-[0_14px_28px_rgba(31,41,55,0.07)] overflow-hidden border border-border/70">
              <img src={brandLogo} alt="UniLink logo" className="h-11 w-11 object-contain" />
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">Create your account</h2>
            <p className="mt-3 text-sm sm:text-base font-semibold text-muted leading-7">
              Join with your university identity and start building your place in the campus network.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted mb-2 px-1">Full name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="input-field pl-12 py-4"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted mb-2 px-1">University email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@university.edu"
                  className="input-field pl-12 py-4"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted mb-2 px-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    className="input-field pl-12 pr-12 py-4"
                    required
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

              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted mb-2 px-1">Confirm password</label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter password"
                    className="input-field pl-12 pr-12 py-4"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-sm font-extrabold uppercase tracking-[0.18em] flex items-center justify-center gap-3"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-7 text-sm font-semibold text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-primary hover:text-ink transition-colors">
              Log in here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
