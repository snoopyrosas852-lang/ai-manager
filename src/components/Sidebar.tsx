import React from 'react';
import { LayoutDashboard, Wrench, BookOpen, MessageSquare, Search, Settings, User } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const navItems = [
    { id: 'cost', label: '成本看板', icon: LayoutDashboard },
    { id: 'tools', label: '工具管理', icon: Wrench },
    { id: 'knowledge', label: '知识库', icon: BookOpen },
    { id: 'sessions', label: '会话审计', icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-4 flex items-center gap-3">
        {/* Seal Logo */}
        <div className="w-10 h-10 bg-[#a31d24] rounded flex p-[3px] shrink-0">
          <div className="w-full h-full border-[1.5px] border-white rounded-sm grid grid-cols-2 grid-rows-2">
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">国</div>
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">威</div>
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">际</div>
            <div className="flex items-center justify-center text-white text-[11px] font-serif leading-none">亨</div>
          </div>
        </div>
        {/* Text Logo */}
        <div className="flex flex-col justify-center">
          <span className="font-bold text-xl tracking-[0.15em] text-[#a31d24] leading-none font-serif mb-1">威亨国际</span>
          <span className="text-[8px] font-bold text-[#a31d24] tracking-[0.02em] leading-none uppercase">Xian Heng International</span>
        </div>
      </div>
      
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索" 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">管理员</div>
            <div className="text-xs text-slate-500 truncate">admin@xianheng.com</div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
