import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'operator';
  module?: string;
}

export default function RoleGuard({ children, requiredRole, module }: RoleGuardProps) {
  const { user } = useAuth();
  const { canView } = useRole();

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Unauthorized />;
  }

  if (module && !canView(module)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
}

function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">无权限访问</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        您的账号没有访问此功能的权限，请联系管理员申请权限。
      </p>
    </div>
  );
}
