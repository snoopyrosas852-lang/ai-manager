import React, { useState } from 'react';
import { Search, Plus, FileText, Database, ArrowLeft, Settings, ExternalLink, FileSpreadsheet, ListFilter, ChevronDown, ToggleRight } from 'lucide-react';

export default function KnowledgeBase() {
  const [selectedKb, setSelectedKb] = useState<any>(null);

  const knowledgeBases = [
    { id: 1, name: 'ai税编物料', author: '方焕梅', editedAt: '17 小时前', tags: ['通用', '高质量', '混合检索'], desc: 'useful for when you want to answer queries about the 2026-02-24-18-13-24_EXPORT_CSV_24113544_468_0_part0221.csv', docCount: 159, hitCount: 0, updatedAt: '17 小时前', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 2, name: '1025自营物料库', author: 'lgbisha', editedAt: '17 天前', tags: ['通用', '高质量', '混合检索'], desc: '', docCount: 130, hitCount: 0, updatedAt: '17 天前', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    { id: 3, name: '东方电气-咸亨.xlsx...', author: 'Pyramid', editedAt: '24 天前', tags: ['通用', '高质量', '向量检索', '多模态'], desc: 'useful for when you want to answer queries about the 东方电气', docCount: 2, hitCount: 0, updatedAt: '24 天前', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 4, name: 'Dify_Knowledge_Bas...', author: 'Pyramid', editedAt: '1 个月前', tags: ['通用', '高质量', '混合检索'], desc: 'useful for when you want to answer queries about the Dify_Knowledge_Base.xlsx', docCount: 1, hitCount: 0, updatedAt: '1 个月前', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 5, name: 'mpm物料', author: 'lgbisha', editedAt: '21 天前', tags: ['通用', '高质量', '混合检索'], desc: '', docCount: 3477, hitCount: 2, updatedAt: '21 天前', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  ];

  const documents = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `2026-02-24-18-13-24_EXPORT_CSV_24113544_468_0_part021${8 - i}.csv`,
    mode: '通用',
    chars: 0,
    recalls: 0,
    uploadTime: i < 6 ? '2026-02-25 13:15' : '2026-02-25 13:14',
    status: '排队中'
  }));

  if (selectedKb) {
    return (
      <div className="space-y-6 max-w-full mx-auto animate-in fade-in duration-200">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => setSelectedKb(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-slate-800">{selectedKb.name}</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-900 mb-2">文档</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              知识库的所有文件都在这里显示，整个知识库都可以链接到 Dify 引用或通过 Chat 插件进行索引。
              <a href="#" className="text-blue-600 hover:underline flex items-center gap-1">了解更多 <ExternalLink className="w-3 h-3" /></a>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>全部</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜索" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 border-l border-slate-200 pl-3">
                <span>排序: 上传时间</span>
                <button className="p-1 hover:bg-slate-100 rounded"><ListFilter className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Settings className="w-4 h-4" />
                元数据
              </button>
              <button className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-slate-400 font-medium border-b border-slate-100">
                <tr>
                  <th className="pb-3 pl-2 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="pb-3 w-12">#</th>
                  <th className="pb-3">名称</th>
                  <th className="pb-3 w-32">分段模式</th>
                  <th className="pb-3 w-24">字符数</th>
                  <th className="pb-3 w-24">召回次数</th>
                  <th className="pb-3 w-40">上传时间</th>
                  <th className="pb-3 w-32">状态</th>
                  <th className="pb-3 w-20 text-right pr-4">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 group">
                    <td className="py-3 pl-2"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="py-3 text-slate-400">{doc.id}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-slate-700 truncate max-w-[300px]" title={doc.name}>{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-500 bg-slate-50">
                        <ListFilter className="w-3 h-3" />
                        {doc.mode}
                      </span>
                    </td>
                    <td className="py-3">{doc.chars}</td>
                    <td className="py-3">{doc.recalls}</td>
                    <td className="py-3">{doc.uploadTime}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-4">
                      <button className="text-blue-600 hover:text-blue-700">
                        <ToggleRight className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <div className="flex justify-end gap-3 mb-6">
        <div className="relative">
          <select className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm">
            <option>全部标签</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索" 
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create New Card */}
        <div className="bg-slate-100/50 rounded-xl border border-slate-200 border-dashed p-4 flex flex-col justify-between min-h-[160px] hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="space-y-3">
            <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              <Plus className="w-4 h-4" />
              创建知识库
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              <Database className="w-4 h-4" />
              通过知识流水线创建知识库
            </button>
          </div>
          <div className="pt-4 border-t border-slate-200/60 mt-4">
            <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              <ExternalLink className="w-4 h-4" />
              连接外部知识库
            </button>
          </div>
        </div>

        {/* Knowledge Base Cards */}
        {knowledgeBases.map((kb) => (
          <div 
            key={kb.id} 
            onClick={() => setSelectedKb(kb)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-[160px] hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${kb.iconBg} flex items-center justify-center shrink-0 relative`}>
                <Database className={`w-5 h-5 ${kb.iconColor}`} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded flex items-center justify-center border border-white">
                  <Database className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{kb.name}</h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <span className="truncate">{kb.author}</span>
                  <span>·</span>
                  <span>编辑于 {kb.editedAt}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {kb.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-4">
              {kb.desc}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {kb.docCount}
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                {kb.hitCount}
              </div>
              <div className="flex-1 text-right">
                更新于 {kb.updatedAt}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

