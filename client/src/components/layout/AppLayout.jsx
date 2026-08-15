import { Outlet } from 'react-router-dom';
import { Sidebar, BottomNav } from './Nav.jsx';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-neutral-950">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
