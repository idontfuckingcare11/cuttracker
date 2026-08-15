import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from '../api/client.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('cuttrack-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('cuttrack-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () =>
      apiGet('/auth/me')
        .then((data) => {
          if (!active) return;
          setUser(data.user);
          setNeedsOnboarding(data.needsOnboarding);
        })
        .catch(() => {
          if (active) {
            setUser(null);
            setNeedsOnboarding(false);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    load();
    const onUnauthorized = () => {
      setUser(null);
      setNeedsOnboarding(false);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiPost('/auth/login', { email, password });
    setUser(data.user);
    setNeedsOnboarding(data.needsOnboarding);
    return data;
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await apiPost('/auth/register', { email, password });
    setUser(data.user);
    setNeedsOnboarding(data.needsOnboarding);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } finally {
      setUser(null);
      setNeedsOnboarding(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet('/auth/me');
      setUser(data.user);
      setNeedsOnboarding(data.needsOnboarding);
    } catch {
      setUser(null);
      setNeedsOnboarding(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, needsOnboarding, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
