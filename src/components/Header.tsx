import React from 'react';
import { Search, Download, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center text-sm text-slate-500">
        <span>管理后台</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="font-medium text-slate-900">{title}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="全局搜索..." 
            className="w-64 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Download className="w-4 h-4" />
          导出数据
        </button>
      </div>
    </header>
  );
}
