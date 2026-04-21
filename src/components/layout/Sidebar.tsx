import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bug,
  FlaskConical,
  Zap,
  FolderKanban,
  BookOpen,
  Users,
  Search,
  Settings,
  User,
  Target,
  Database,
  Bot,
  Store,
  Cloud,
  FileStack,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: '数据监控',
    items: [
      { id: 'cost', label: '成本看板', icon: LayoutDashboard, path: '/cost' },
      { id: 'sessions', label: '会话审计', icon: MessageSquare, path: '/sessions' },
      { id: 'toolbox-market', label: '百宝箱', icon: Store, path: '/toolbox-market' },
    ],
  },
  {
    title: '开发工具',
    adminOnly: true,
    items: [
      { id: 'debug', label: 'Prompt 调试', icon: Bug, path: '/debug' },
      { id: 'testbench', label: '测评工作台', icon: FlaskConical, path: '/testbench' },
      { id: 'intent', label: 'Skill 路由', icon: Target, path: '/intent' },
      { id: 'qa-knowledge', label: '对话 QA 知识库（JSON）', icon: Database, path: '/qa-knowledge' },
      { id: 'agent', label: 'Agent 配置', icon: Bot, path: '/agent' },
    ],
  },
  {
    title: '系统配置',
    items: [
      { id: 'assistant', label: '前台配置', icon: Settings, path: '/config/assistant', adminOnly: true },
      { id: 'skills', label: 'Skill 管理', icon: Zap, path: '/config/skills', adminOnly: true },
      { id: 'projects', label: '项目档案', icon: FolderKanban, path: '/config/projects', adminOnly: true },
      { id: 'knowledge', label: '对话 QA 知识库编辑（JSON）', icon: BookOpen, path: '/config/knowledge' },
      {
        id: 'department-knowledge',
        label: '部门资料与 ACL',
        icon: Cloud,
        path: '/config/department-knowledge',
        adminOnly: true,
      },
      {
        id: 'managed-corpus',
        label: '受管文档与向量',
        icon: FileStack,
        path: '/config/managed-corpus',
        adminOnly: true,
      },
      { id: 'users', label: '用户权限管理', icon: Users, path: '/config/users', adminOnly: true },
    ],
  },
];

const roleLabel: Record<string, string> = {
  admin: '管理员',
  operator: '运营人员',
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [searchQuery, setSearchQuery] = useState('');

  const visibleSections = sections
    .filter((section) => !section.adminOnly || isAdmin)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly || isAdmin),
    }))
    .filter((section) => section.items.length > 0);

  const filteredSections = searchQuery
    ? visibleSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((section) => section.items.length > 0)
    : visibleSections;

  const isActive = (path: string) => {
    if (path === '/sessions') {
      return location.pathname === '/sessions' || location.pathname.startsWith('/sessions/');
    }
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#a31515] rounded flex p-[3px] shrink-0">
          <div className="w-full h-full border-[1.5px] border-white rounded-sm grid grid-cols-2 grid-rows-2">
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">咸</div>
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">亨</div>
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">国</div>
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">际</div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-bold text-xl tracking-[0.15em] text-[#a31515] leading-none font-serif mb-1">
            咸亨国际
          </span>
          <span className="text-[8px] font-bold text-[#a31515] tracking-[0.02em] leading-none uppercase">
            Xian Heng International
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索功能..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-3">
            <div className="px-5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="px-3 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {user?.name ?? '未登录'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {user?.role ? roleLabel[user.role] ?? user.role : '—'}
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
