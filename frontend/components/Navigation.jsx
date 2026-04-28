import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, LayoutDashboard, MessageSquare, PlusCircle, User } from 'lucide-react';

const Navigation = () => {
  const menuItems = [
    { label: 'Feed', path: '/', caption: 'Latest campus activity', Icon: LayoutDashboard },
    { label: 'Groups', path: '/groups', caption: 'Clubs and communities', Icon: Compass },
    { label: 'Create', path: '/create', caption: 'Share an update', Icon: PlusCircle },
    { label: 'Messages', path: '/messages', caption: 'Direct conversations', Icon: MessageSquare },
    { label: 'Profile', path: '/profile', caption: 'Your public presence', Icon: User },
  ];

  return (
    <div className="glass-card p-3 lg:p-4">
      <div className="px-3 pt-2 pb-4 hidden lg:block">
        <p className="text-[11px] uppercase tracking-[0.24em] font-extrabold text-muted">Workspace</p>
        <p className="mt-1 text-sm font-semibold text-ink/75">Move through feed, people, and conversations.</p>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map(({ label, path, caption, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200',
                isActive
                  ? 'bg-primary/12 text-ink ring-1 ring-primary/20 shadow-[0_12px_24px_rgba(31,41,55,0.06)]'
                  : 'text-ink/66 hover:bg-white/70 hover:text-ink',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={[
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors',
                    isActive ? 'bg-primary text-white shadow-[0_12px_24px_rgba(201,107,28,0.24)]' : 'bg-panel text-primary group-hover:bg-primary/10',
                  ].join(' ')}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2.2} />
                </div>

                <div className="hidden lg:block min-w-0">
                  <p className="text-sm font-extrabold tracking-tight truncate">{label}</p>
                  <p className="text-[11px] font-semibold text-muted truncate">{caption}</p>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Navigation;
