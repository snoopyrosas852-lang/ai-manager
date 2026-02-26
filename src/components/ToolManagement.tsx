import React, { useState } from 'react';
import { Search, Plus, FileText, ArrowLeft, Play, History, Settings, ChevronDown, Bot, Workflow, MessageSquare, User, UploadCloud, Repeat, Cpu, LogOut } from 'lucide-react';

export default function ToolManagement() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  const workflows = [
    { id: 1, name: '信息比对匹配-0209', author: 'CXX9231', editedAt: '2026/02/09 17:24', desc: '上传文件，进行信息匹配比对，根据不同维度和权重计算综合得分', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 2, name: '匹配产品信息', author: 'Pyramid', editedAt: '2026/02/05 09:44', desc: '', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 3, name: '详图稽查', author: 'Pyramid', editedAt: '2026/02/03 14:01', desc: '详图稽查', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    { id: 4, name: '测试东方电气', author: 'Pyramid', editedAt: '2026/02/02 13:57', desc: '测试', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { id: 5, name: '命名规范清洗', author: 'Pyramid', editedAt: '2026/02/02 11:27', desc: '依据不同项目平台的命名规范要求进行检测对应信息内容，检测到之后进行提示修正', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 6, name: '业务数据提取-pdf转图片效果', author: '方焕梅', editedAt: '2026/01/30 14:47', desc: '识别签收单', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { id: 7, name: 'mpm物料清洗', author: 'caict', editedAt: '2026/01/29 10:14', desc: '', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 8, name: '业务数据提取', author: 'Pyramid', editedAt: '2026/01/27 13:31', desc: '识别签收单', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
    { id: 9, name: '主详图生成器', author: 'Pyramid', editedAt: '2026/01/22 11:24', desc: '', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { id: 10, name: '管网映射客户分类', author: 'Pyramid', editedAt: '2026/01/20 11:57', desc: '', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  ];

  if (selectedWorkflow) {
    return (
      <div className="flex flex-col h-full -m-6 animate-in fade-in duration-200 bg-[#f8f9fa]">
        {/* Workflow Header */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedWorkflow(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-800">{selectedWorkflow.name}</h2>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-medium">v4 · 已发布 17 天前</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <Play className="w-4 h-4 text-blue-600" />
              测试运行 <span className="text-xs text-slate-400 ml-1">alt R</span>
            </button>
            <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <History className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative">
              <Settings className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full border border-white"></span>
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              发布
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Workflow Canvas Area */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          
          {/* Mock Nodes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-12">
            
            {/* Node 1: Start */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-800">用户输入</span>
              </div>
              <div className="p-3 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">(x) inFile</span>
                  <span className="text-slate-400 flex items-center gap-1">必填 <FileText className="w-3 h-3" /></span>
                </div>
              </div>
              {/* Output Port */}
              <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-y-1/2"></div>
            </div>

            {/* Connection Line */}
            <div className="absolute left-[256px] top-1/2 w-12 h-0.5 bg-slate-300 -translate-y-1/2 z-0"></div>

            {/* Node 2: Document Extractor */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-emerald-500 overflow-hidden relative z-10">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">文档提取器</span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/30">
                <div className="text-xs text-slate-500 mb-1">输入变量</div>
                <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-600">用户输入 /</span>
                  <span className="text-blue-600 font-mono">(x) inFile</span>
                </div>
              </div>
              {/* Input Port */}
              <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-emerald-500 rounded-full -translate-y-1/2"></div>
              {/* Output Port */}
              <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full -translate-y-1/2"></div>
            </div>

            {/* Connection Line */}
            <div className="absolute left-[560px] top-1/2 w-12 h-0.5 bg-slate-300 -translate-y-1/2 z-0"></div>

            {/* Node 3: Iteration */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative z-10 p-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <Repeat className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-800">迭代</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-3 flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-600" />
                </div>
                <div className="w-8 h-px bg-slate-300"></div>
                <button className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                  <Plus className="w-3 h-3" /> 添加节点
                </button>
              </div>
              {/* Input Port */}
              <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-y-1/2"></div>
              {/* Output Port */}
              <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full -translate-y-1/2"></div>
            </div>

            {/* Connection Line */}
            <div className="absolute left-[864px] top-1/2 w-12 h-0.5 bg-slate-300 -translate-y-1/2 z-0"></div>

            {/* Node 4: LLM */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-emerald-500 overflow-hidden relative z-10">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">LLM</span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/30">
                <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                  <Bot className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-slate-700 font-medium">DeepSeek-V3.2-exp</span>
                  <span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] ml-auto">CHAT</span>
                </div>
              </div>
              {/* Input Port */}
              <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-emerald-500 rounded-full -translate-y-1/2"></div>
              {/* Output Port */}
              <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full -translate-y-1/2"></div>
            </div>

            {/* Connection Line */}
            <div className="absolute left-[1168px] top-1/2 w-12 h-0.5 bg-slate-300 -translate-y-1/2 z-0"></div>

            {/* Node 5: Output */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-emerald-500 overflow-hidden relative z-10">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">输出</span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/30">
                <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                  <Cpu className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-600">LLM /</span>
                  <span className="text-blue-600 font-mono">(x) textString</span>
                </div>
              </div>
              {/* Input Port */}
              <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-emerald-500 rounded-full -translate-y-1/2"></div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-6 text-sm">
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium pb-2 border-b-2 border-transparent">
            <Workflow className="w-4 h-4" />
            全部
          </button>
          <button className="flex items-center gap-2 text-blue-600 font-medium pb-2 border-b-2 border-blue-600">
            <Workflow className="w-4 h-4" />
            工作流
          </button>
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium pb-2 border-b-2 border-transparent">
            <MessageSquare className="w-4 h-4" />
            Chatflow
          </button>
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium pb-2 border-b-2 border-transparent">
            <Bot className="w-4 h-4" />
            聊天助手
          </button>
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium pb-2 border-b-2 border-transparent">
            <User className="w-4 h-4" />
            Agent
          </button>
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium pb-2 border-b-2 border-transparent">
            <FileText className="w-4 h-4" />
            文本生成
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            我创建的
          </label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>全部标签</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Create New Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col min-h-[160px] shadow-sm">
          <div className="text-sm font-medium text-slate-800 mb-4">创建应用</div>
          <div className="space-y-3">
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors w-full text-left">
              <Plus className="w-4 h-4" />
              创建空白应用
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors w-full text-left">
              <FileText className="w-4 h-4" />
              从应用模板创建
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors w-full text-left">
              <UploadCloud className="w-4 h-4" />
              导入 DSL 文件
            </button>
          </div>
        </div>

        {/* Workflow Cards */}
        {workflows.map((wf) => (
          <div 
            key={wf.id} 
            onClick={() => setSelectedWorkflow(wf)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-[160px] hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${wf.iconBg} flex items-center justify-center shrink-0 relative`}>
                <Bot className={`w-5 h-5 ${wf.iconColor}`} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded flex items-center justify-center border border-white">
                  <Workflow className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{wf.name}</h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <span className="truncate">{wf.author}</span>
                  <span>·</span>
                  <span>编辑于 {wf.editedAt}</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-4">
              {wf.desc}
            </p>
            
            <div className="pt-3 border-t border-slate-50">
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors">
                <Plus className="w-3 h-3" /> 添加标签
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
