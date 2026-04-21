import { useState, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Search, Save, Upload, History, Loader2, BookOpen, Plus, X } from 'lucide-react';
import {
  getKnowledgeBases,
  getKnowledgeBase,
  updateKnowledgeBase,
  publishKnowledgeBase,
  createKnowledgeBase,
  getProjects,
} from '../../api/config';
import type { KnowledgeBaseItem } from '../../types/config';
import type { ProjectConfig } from '../../types/config';
import KnowledgeVersions from './KnowledgeVersions';

type EditStatus = 'saved' | 'modified' | 'published';

interface CreateKbModalProps {
  projects: ProjectConfig[];
  onSubmit: (projectId: string, name: string, description: string) => Promise<void>;
  onClose: () => void;
}

function CreateKbModal({ projects, onSubmit, onClose }: CreateKbModalProps) {
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId.trim() || !name.trim()) {
      alert('请选择项目并填写知识库名称');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(projectId.trim(), name.trim(), description.trim());
    } catch {
      alert('新建失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="create-kb-title">
        <div className="flex items-center justify-between mb-4">
          <h2 id="create-kb-title" className="text-lg font-semibold text-gray-900">新建知识库</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">知识库名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：考核规则、产品说明"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述（选填）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述该知识库用途"
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              取消
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KnowledgeEditor() {
  const [kbList, setKbList] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [selectedKb, setSelectedKb] = useState<KnowledgeBaseItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [editStatus, setEditStatus] = useState<EditStatus>('saved');
  const [projectFilter, setProjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);

  useEffect(() => {
    fetchList();
    getProjects().then(setProjects).catch(() => {});
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const data = await getKnowledgeBases();
      setKbList(data);
    } catch {
      alert('获取知识库列表失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(id: string) {
    setSelectedId(id);
    try {
      const kb = await getKnowledgeBase(id);
      setSelectedKb(kb);
      setEditorContent(kb.content);
      setOriginalContent(kb.content);
      setEditStatus(kb.status === 'published' ? 'published' : 'saved');
    } catch {
      alert('获取知识库内容失败');
    }
  }

  function handleContentChange(value: string | undefined) {
    const v = value ?? '';
    setEditorContent(v);
    setEditStatus(v !== originalContent ? 'modified' : (selectedKb?.status === 'published' ? 'published' : 'saved'));
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateKnowledgeBase(selectedId, editorContent);
      setOriginalContent(editorContent);
      setEditStatus('saved');
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!selectedId) return;
    if (!confirm('确定要发布此知识库？发布后将立即对线上生效。')) return;
    setPublishing(true);
    try {
      if (editorContent !== originalContent) {
        await updateKnowledgeBase(selectedId, editorContent);
        setOriginalContent(editorContent);
      }
      await publishKnowledgeBase(selectedId);
      setEditStatus('published');
      if (selectedKb) {
        setSelectedKb({ ...selectedKb, status: 'published', publishedAt: new Date().toISOString() });
      }
    } catch {
      alert('发布失败');
    } finally {
      setPublishing(false);
    }
  }

  function handleRollbackDone() {
    if (selectedId) handleSelect(selectedId);
    fetchList();
  }

  async function handleCreateKnowledgeBase(projectId: string, name: string, description: string) {
    const item = await createKnowledgeBase({ projectId, name, description: description || undefined, content: '{}' });
    await fetchList();
    setShowCreateModal(false);
    handleSelect(item.id);
  }

  const projectIds = useMemo(() => {
    const set = new Set(kbList.map((kb) => kb.projectId || '未分组'));
    return Array.from(set).sort();
  }, [kbList]);

  const filteredList = useMemo(() => {
    return kbList.filter((kb) => {
      const matchSearch =
        !searchQuery ||
        kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (kb.projectId && kb.projectId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (kb.description && kb.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchProject = !projectFilter || (kb.projectId || '未分组') === projectFilter;
      return matchSearch && matchProject;
    });
  }, [kbList, searchQuery, projectFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(
    () => filteredList.slice((page - 1) * pageSize, page * pageSize),
    [filteredList, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, projectFilter]);

  const statusBadge = {
    modified: { label: '已修改', cls: 'bg-yellow-100 text-yellow-700' },
    saved: { label: '已保存', cls: 'bg-green-100 text-green-700' },
    published: { label: '已发布', cls: 'bg-blue-100 text-blue-700' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">知识库编辑器</h1>
        <p className="text-sm text-gray-500 mt-1">编辑和发布各项目的知识库内容</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left: 知识库列表表格 + 分页 */}
        <div className="w-[420px] shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索名称、项目、描述..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部项目</option>
              {projectIds.map((pid) => (
                <option key={pid} value={pid}>{pid}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> 新建知识库
            </button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span className="text-xs">加载中</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">无结果</div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-left text-gray-600 border-b border-gray-200">
                    <th className="px-2 py-2 font-medium w-8">#</th>
                    <th className="px-2 py-2 font-medium">名称</th>
                    <th className="px-2 py-2 font-medium w-16">项目</th>
                    <th className="px-2 py-2 font-medium w-20 min-w-[4.5rem]">状态</th>
                    <th className="px-2 py-2 font-medium w-24">更新</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((kb, idx) => (
                    <tr
                      key={kb.id}
                      onClick={() => handleSelect(kb.id)}
                      className={`border-t border-gray-100 cursor-pointer transition-colors ${
                        selectedId === kb.id
                          ? 'bg-blue-50 text-blue-800'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-2 py-1.5 text-gray-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-2 py-1.5 font-medium truncate max-w-[140px]" title={kb.name}>
                        {kb.name}
                      </td>
                      <td className="px-2 py-1.5 text-gray-600 truncate max-w-[60px]" title={kb.projectId}>
                        {kb.projectId || '—'}
                      </td>
                      <td className="px-2 py-1.5 w-20 min-w-[4.5rem]">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
                            kb.status === 'published'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {kb.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-400 text-xs">
                        {kb.updatedAt ? new Date(kb.updatedAt).toLocaleDateString('zh-CN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredList.length > 0 && (
            <div className="p-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="text-gray-500">共 {filteredList.length} 条</span>
              <div className="flex items-center gap-1">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-gray-200 px-1.5 py-0.5"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>每页 {n}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-1.5 py-0.5 rounded border border-gray-200 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="text-gray-600">{page}/{totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-1.5 py-0.5 rounded border border-gray-200 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Editor */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {!selectedKb ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BookOpen className="w-10 h-10 mb-3" />
              <p className="text-sm">请从左侧选择知识库</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800 text-sm">{selectedKb.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[editStatus].cls}`}>
                    {statusBadge[editStatus].label}
                  </span>
                  {selectedKb.publishedAt && (
                    <span className="text-xs text-gray-400">
                      上次发布: {new Date(selectedKb.publishedAt).toLocaleString('zh-CN')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowVersions(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" /> 版本历史
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || editStatus !== 'modified'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    保存草稿
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    发布
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language="json"
                  value={editorContent}
                  onChange={handleContentChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                  theme="vs-dark"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Version History Modal */}
      {showVersions && selectedId && (
        <KnowledgeVersions
          kbId={selectedId}
          onClose={() => setShowVersions(false)}
          onRollback={handleRollbackDone}
        />
      )}

      {showCreateModal && (
        <CreateKbModal
          projects={projects}
          onSubmit={handleCreateKnowledgeBase}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
