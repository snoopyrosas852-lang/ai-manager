import { useAuth } from './useAuth';

export function useRole() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator',
    canAccessAdmin: ['admin', 'operator'].includes(user?.role || ''),
    canEdit: (module: string) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'operator' && module === 'knowledge') return true;
      return false;
    },
    canView: (module: string) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'operator' && ['cost', 'sessions', 'knowledge'].includes(module))
        return true;
      return false;
    },
  };
}
