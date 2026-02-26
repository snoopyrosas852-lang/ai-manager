import React from 'react';
import { DollarSign, Hash, TrendingUp, Activity, AlertCircle } from 'lucide-react';

export default function CostDashboard() {
  const stats = [
    { label: '总消耗费用', value: '$1,284.50', trend: '+12.5%', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '总 Token 数', value: '14.2M', trend: '+8.2%', icon: Hash, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '今日预计费用', value: '$45.20', trend: '-2.4%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '平均会话成本', value: '$0.04', trend: '0.0%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const chartData = [
    { day: '周一', gpt4: 40, gemini: 24 },
    { day: '周二', gpt4: 30, gemini: 13 },
    { day: '周三', gpt4: 20, gemini: 58 },
    { day: '周四', gpt4: 27, gemini: 39 },
    { day: '周五', gpt4: 18, gemini: 48 },
    { day: '周六', gpt4: 23, gemini: 38 },
    { day: '周日', gpt4: 34, gemini: 43 },
  ];

  const maxVal = Math.max(...chartData.map(d => d.gpt4 + d.gemini));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith('+');
          return (
            <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trend} <span className="text-slate-400 font-normal">较上周</span>
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">近 7 天成本分布</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">GPT-4o</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
              <span className="text-slate-600">Gemini 1.5 Pro</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 flex items-end gap-2 sm:gap-6 justify-between pt-4">
          {chartData.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-2">
              <div className="w-full flex flex-col justify-end h-48 group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  ${d.gpt4 + d.gemini}
                </div>
                <div 
                  className="w-full bg-indigo-400 rounded-t-sm transition-all duration-300 hover:brightness-110"
                  style={{ height: `${(d.gemini / maxVal) * 100}%` }}
                ></div>
                <div 
                  className="w-full bg-blue-500 rounded-b-sm transition-all duration-300 hover:brightness-110"
                  style={{ height: `${(d.gpt4 / maxVal) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-900">成本预警设置</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-2">当月度总消耗达到设定阈值时，系统将发送邮件通知管理员。</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  defaultValue={2000}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                保存设置
              </button>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg w-full sm:w-64">
            <div className="text-sm font-medium text-amber-800 mb-1">当前进度 (本月)</div>
            <div className="flex justify-between text-xs text-amber-600 mb-2">
              <span>$1,284.50</span>
              <span>$2,000.00</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
