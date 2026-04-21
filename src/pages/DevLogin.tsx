import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { setToken } from '../api/http';

export default function DevLogin() {
  const [token, setTokenInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setToken(t);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#f3f5f9] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-10 max-w-md w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#a31515] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">咸亨国际</h1>
            <p className="text-xs text-slate-500">管理后台</p>
          </div>
        </div>

        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2 text-center">开发调试登录</h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          输入 <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">dev</kbd> 或 <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">test</kbd> 即可进入
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="输入 dev 或 test"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/30 focus:border-[#a31515]"
          />
          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full py-2.5 bg-[#a31515] text-white rounded-lg font-medium hover:bg-[#8a1111] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            进入
          </button>
        </form>
      </div>
    </div>
  );
}
