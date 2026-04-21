import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import { getMe, loginWithDingTalk, type AuthUser } from '../api/auth';
import { getToken, clearToken } from '../api/http';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (authCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // 开发模式：dev/test 直接通过，不请求后端（不区分大小写）
    const t = token.toLowerCase();
    if (t === 'dev' || t === 'test') {
      setUser({
        id: 1005,
        name: '调试管理员',
        role: 'admin',
        salesCode: null,
        managedProjects: [],
      });
      setLoading(false);
      return;
    }

    getMe()
      .then((u) => {
        if (u.role !== 'admin') {
          setError('权限不足，仅超级管理员可登录后台');
          clearToken();
          setUser(null);
        } else {
          setUser(u);
        }
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (authCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithDingTalk(authCode);
      if (res.user.role !== 'admin') {
        clearToken();
        setError('权限不足，仅超级管理员可登录后台');
        setUser(null);
        return;
      }
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || '登录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, error, login, logout } },
    children,
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
