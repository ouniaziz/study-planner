import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, CalendarDays, BarChart3,
  LogOut, GraduationCap, Sparkles
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects',  icon: BookOpen,        label: 'Subjects'  },
  { to: '/planner',   icon: CalendarDays,    label: 'Planner'   },
  { to: '/progress',  icon: BarChart3,       label: 'Progress'  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-surface border-r border-bg-border
                      flex flex-col z-40 transition-all duration-300">
      {/* Logo */}
      <div className="p-6 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center
                          shadow-glow-sm flex-shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-text-primary text-sm leading-none">AI Study</div>
            <div className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles size={10} />Planner
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
               transition-all duration-200 group
               ${isActive
                 ? 'bg-primary/15 text-primary border border-primary/25 shadow-glow-sm'
                 : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-bg-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-card border border-bg-border mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.email}</p>
            <p className="text-xs text-text-muted">Student</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                     text-text-muted hover:text-red-400 hover:bg-red-500/5
                     border border-transparent hover:border-red-500/15
                     transition-all duration-200">
          <LogOut size={16} />Logout
        </button>
      </div>
    </aside>
  );
}
