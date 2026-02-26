import React, { useState } from 'react';
import { Search, Calendar, ThumbsUp, ThumbsDown, Eye, X, MessageSquare, Bot } from 'lucide-react';

export default function SessionAudit() {
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const sessions = [
    { id: 'sess_10293', title: '如何配置 Nginx 反向代理？', user: 'user_8821', ttft: '1.2s', tokens: 1250, rating: 'up', time: '10分钟前' },
    { id: 'sess_10292', title: '帮我写一封英文催款邮件', user: 'user_4390', ttft: '0.8s', tokens: 450, rating: 'none', time: '1小时前' },
    { id: 'sess_10291', title: '分析这份财报的核心数据', user: 'user_9912', ttft: '3.5s', tokens: 4820, rating: 'down', time: '2小时前' },
    { id: 'sess_10290', title: 'React 19 有哪些新特性', user: 'user_8821', ttft: '1.1s', tokens: 890, rating: 'up', time: '昨天' },
    { id: 'sess_10289', title: '生成一个 Python 爬虫脚本', user: 'user_1102', ttft: '1.5s', tokens: 1120, rating: 'none', time: '昨天' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索会话 ID 或用户 ID..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none">
              <option>最近 7 天</option>
              <option>最近 30 天</option>
              <option>本月</option>
              <option>自定义范围</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>共 <strong className="text-slate-900">1,204</strong> 条记录</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">会话标题</th>
                <th className="px-6 py-4">用户 ID</th>
                <th className="px-6 py-4">首轮响应 (TTFT)</th>
                <th className="px-6 py-4">总消耗 Token</th>
                <th className="px-6 py-4">用户评价</th>
                <th className="px-6 py-4">时间</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 truncate max-w-[250px]">{session.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">{session.id}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{session.user}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      parseFloat(session.ttft) > 2.0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {session.ttft}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{session.tokens.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {session.rating === 'up' && <ThumbsUp className="w-4 h-4 text-emerald-500" />}
                    {session.rating === 'down' && <ThumbsDown className="w-4 h-4 text-red-500" />}
                    {session.rating === 'none' && <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{session.time}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedSession(session)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50">上一页</button>
            <button className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">会话详情</h3>
                <p className="text-sm text-slate-500 font-mono mt-0.5">{selectedSession.id}</p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* User Prompt */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 mb-1">User ({selectedSession.user})</div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-sm text-slate-700 shadow-sm">
                    {selectedSession.title}
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 mb-1">AI Assistant</div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-sm text-slate-700 shadow-sm">
                    <p className="mb-2">这是一个模拟的 AI 回复内容。在实际应用中，这里会展示完整的 Markdown 格式的回答。</p>
                    <pre className="bg-slate-50 p-3 rounded border border-slate-100 text-xs font-mono overflow-x-auto">
                      {`// Example Code
function helloWorld() {
  console.log("Hello, World!");
}`}
                    </pre>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedSession.time}
                    </span>
                    <span>TTFT: {selectedSession.ttft}</span>
                    <span>Tokens: {selectedSession.tokens}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
