import { useLocation } from 'react-router-dom';
import { ChevronRight, CalendarDays } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/cost': '成本看板',
  '/sessions': '会话审计',
  '/toolbox-market': '百宝箱',
  '/debug': 'Prompt 调试台',
  '/testbench': '测评工作台',
  '/config/assistant': '前台配置',
  '/config/skills': 'Skill 管理',
  '/config/projects': '项目档案',
  '/config/knowledge': '知识库编辑',
  '/config/department-knowledge': '部门知识库（文件云盘）',
  '/config/users': '用户权限管理',
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 星期${weekday}`;
}

function resolveTitle(pathname: string): string {
  if (titleMap[pathname]) return titleMap[pathname];
  if (pathname.startsWith('/sessions/')) return '会话详情';
  return '管理后台';
}

export default function Header() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);

  return (
    <header className="bg-white border-b border-slate-200 h-14 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center text-sm text-slate-500">
        <span>管理后台</span>
        <ChevronRight className="w-4 h-4 mx-1.5 text-slate-300" />
        <span className="font-medium text-slate-900">{title}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <CalendarDays className="w-4 h-4 text-slate-400" />
        <span>{formatDate(new Date())}</span>
      </div>
    </header>
  );
}
