import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import { getAvatarUrl } from '../services/media';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] border-b border-white/60 bg-[rgba(250,245,238,0.82)] backdrop-blur-2xl shadow-[0_10px_30px_rgba(31,41,55,0.06)]">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-8">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-button text-white flex items-center justify-center shadow-[0_14px_28px_rgba(166,123,91,0.28)]">
              <span className="text-2xl font-extrabold tracking-tight">U</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] uppercase tracking-[0.26em] text-accent/70 font-extrabold">Student Network</p>
              <h1 className="text-[1.7rem] leading-none font-extrabold tracking-tight text-ink">UniLink</h1>
            </div>
          </Link>

          <div className="w-full max-w-3xl justify-self-center">
            <SearchBar />
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden xl:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent/10 text-accent border border-accent/15 hover:bg-accent/14 transition-colors text-xs font-extrabold uppercase tracking-[0.18em]"
                  >
                    <Shield size={15} />
                    Admin
                  </Link>
                )}

                <button
                  type="button"
                  className="hidden md:inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-border/80 bg-white/70 text-muted hover:text-ink hover:border-primary/25 transition-colors"
                  title="Notifications"
                >
                  <Bell size={18} />
                </button>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-2xl px-2 sm:px-3 py-2 border border-transparent hover:border-border/80 hover:bg-white/55 transition-colors min-w-0"
                >
                  <div className="hidden md:block text-right min-w-0">
                    <p className="text-sm font-extrabold text-ink truncate max-w-[160px]">{user?.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted">
                      {user?.department || 'Campus Profile'}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl overflow-hidden ring-1 ring-primary/15 shadow-[0_10px_20px_rgba(31,41,55,0.08)] bg-panel">
                    <img
                      src={getAvatarUrl(user)}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </div>
                </Link>

                <button
                  onClick={logout}
                  title="Logout"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-red-200/80 bg-red-50/80 text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-[0_8px_16px_rgba(239,68,68,0.12)]"
                >
                  <LogOut size={18} strokeWidth={2.4} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-2xl text-sm font-extrabold text-ink/75 hover:text-ink hover:bg-white/60 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em]"
                >
                  Join UniLink
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
