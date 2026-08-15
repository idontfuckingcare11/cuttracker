import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Utensils, Scale, Dumbbell, TrendingUp, User, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AppContexts.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/food', label: 'Food', icon: Utensils },
  { to: '/app/weight', label: 'Weight', icon: Scale },
  { to: '/app/workout', label: 'Workout', icon: Dumbbell },
  { to: '/app/progress', label: 'Progress', icon: TrendingUp },
  { to: '/app/profile', label: 'Profile', icon: User }
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-sm font-extrabold text-white dark:bg-white dark:text-neutral-900">CT</div>
      <div>
        <p className="text-sm font-extrabold tracking-tight text-ink dark:text-neutral-100">CutTrack</p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Cut · Track · Build</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-surface-alt px-4 py-6 dark:border-neutral-800 dark:bg-neutral-950 lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800/60'
              )
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t border-neutral-200 px-2 pt-4 dark:border-neutral-800">
        <ThemeToggle />
        <button onClick={onLogout} className="btn-ghost text-neutral-500 dark:text-neutral-400" title="Log out">
          <LogOut size={16} />
          <span className="text-xs">Log out</span>
        </button>
      </div>
    </aside>
  );
}

const MOBILE_NAV = NAV;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold transition',
                isActive ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
