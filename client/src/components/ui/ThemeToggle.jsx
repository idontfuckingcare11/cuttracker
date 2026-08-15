import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/AppContexts.jsx';

export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 ${className || ''}`}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
