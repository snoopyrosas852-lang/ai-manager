import { useState, useEffect, useMemo } from 'react';
import { Loader2, FolderOpen, Search, Pencil, X, Plus } from 'lucide-react';
import { getProjects, updateProject, createProject, getSkills } from '../../api/config';
import type { ProjectConfig, SkillConfig } from '../../types/config';

function matchProject(project: ProjectConfig, keyword: string): boolean {
  if (!keyword.trim()) return true;
  const k = keyword.trim().toLowerCase();
  const name = project.name.toLowerCase();
  const shortName = project.shortName.toLowerCase();
  const aliases = project.aliases.join(' ').toLowerCase();
  const matchWords = project.customerMatchKeywords.join(' ').toLowerCase();
  return (
    name.includes(k) ||
    shortName.includes(k) ||
    aliases.includes(k) ||
    matchWords.includes(k) ||
    project.id.toLowerCase().includes(k)
  );
}

interface ProjectFormData {
  name: string;
  shortName: string;
  aliases: string[];
  customerMatchKeywords: string[];
  enabledSkills: string[];
  knowledgeBasePrefix: string;
  enabled: boolean;
}

function toFormData(p: ProjectConfig): ProjectFormData {
  return {
    name: p.name,
    shortName: p.shortName,
    aliases: [...p.aliases],
    customerMatchKeywords: [...p.customerMatchKeywords],
    enabledSkills: [...p.enabledSkills],
    knowledgeBasePrefix: p.knowledgeBasePrefix,
    enabled: p.enabled,
  };
}

interface ProjectEditModalProps {
  project: ProjectConfig;
  skills: SkillConfig[];
  onSave: (id: string, data: Partial<ProjectFormData>) => Promise<void>;
  onClose: () => void;
}

function ProjectEditModal({ project, skills, onSave, onClose }: ProjectEditModalProps) {
  const [form, setForm] = useState<ProjectFormData>(() => toFormData(project));
  const [saving, setSaving] = useState(false);
  const [aliasesText, setAliasesText] = useState(project.aliases.join(', '));
  const [keywordsText, setKeywordsText] = useState(project.customerMatchKeywords.join(', '));

  useEffect(() => {
    setForm(toFormData(project));
    setAliasesText(project.aliases.join(', '));
    setKeywordsText(project.customerMatchKeywords.join(', '));
  }, [project]);

  function parseList(s: string): string[] {
    return s
      .split(/[,，\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(project.id, {
        name: form.name,
        shortName: form.shortName,
        aliases: parseList(aliasesText),
        customerMatchKeywords: parseList(keywordsText),
        enabledSkills: form.enabledSkills,
        knowledgeBasePrefix: form.knowledgeBasePrefix,
        enabled: form.enabled,
      });
      onClose();
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-edit-title"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="project-edit-title" className="text-lg font-semibold text-gray-900">
              编辑项目档案
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简称</label>
            <input
              value={form.shortName}
              onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">别名（逗号分隔）</label>
            <input
              value={aliasesText}
              onChange={(e) => setAliasesText(e.target.value)}
              placeholder="中船, 中船重工, CSSC"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户匹配关键词（逗号分隔）</label>
            <input
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="中船, 船舶, CSSC"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">启用 Skills</label>
            <select
              multiple
              value={form.enabledSkills}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                setForm((f) => ({ ...f, enabledSkills: selected }));
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">按住 Ctrl/Cmd 多选</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">知识库前缀</label>
            <input
              value={form.knowledgeBasePrefix}
              onChange={(e) => setForm((f) => ({ ...f, knowledgeBasePrefix: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="project-enabled"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="project-enabled" className="text-sm font-medium text-gray-700">
              启用项目
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CreateProjectModalProps {
  skills: SkillConfig[];
  onSave: (data: ProjectConfig) => Promise<void>;
  onClose: () => void;
}

function CreateProjectModal({ skills, onSave, onClose }: CreateProjectModalProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [aliasesText, setAliasesText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [enabledSkills, setEnabledSkills] = useState<string[]>([]);
  const [knowledgeBasePrefix, setKnowledgeBasePrefix] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  function parseList(s: string): string[] {
    return s.split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idTrim = id.trim().toLowerCase();
    if (!idTrim || !name.trim()) {
      alert('请填写项目 ID 和项目名称');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(idTrim)) {
      alert('项目 ID 仅允许小写字母、数字、下划线和连字符');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: idTrim,
        name: name.trim(),
        shortName: shortName.trim() || name.trim(),
        aliases: parseList(aliasesText),
        customerMatchKeywords: parseList(keywordsText),
        enabledSkills,
        knowledgeBasePrefix: knowledgeBasePrefix.trim() || idTrim,
        enabled,
      });
      onClose();
    } catch (err: any) {
      alert(err?.message || '新建失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="project-create-title">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="project-create-title" className="text-lg font-semibold text-gray-900">新建项目</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目 ID（英文标识，不可重复）</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="例如：cssc、project_a"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：中船项目"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简称</label>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="例如：中船"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">别名（逗号分隔）</label>
            <input
              value={aliasesText}
              onChange={(e) => setAliasesText(e.target.value)}
              placeholder="中船, 中船重工, CSSC"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户匹配关键词（逗号分隔）</label>
            <input
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="中船, 船舶, CSSC"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">启用 Skills</label>
            <select
              multiple
              value={enabledSkills}
              onChange={(e) => setEnabledSkills(Array.from(e.target.selectedOptions, (o) => o.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[72px]"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">按住 Ctrl/Cmd 多选</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">知识库前缀</label>
            <input
              value={knowledgeBasePrefix}
              onChange={(e) => setKnowledgeBasePrefix(e.target.value)}
              placeholder="默认与项目 ID 一致"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="create-enabled" className="text-sm font-medium text-gray-700">启用项目</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              取消
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [editingProject, setEditingProject] = useState<ProjectConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (!matchProject(p, searchKeyword)) return false;
      if (statusFilter === 'enabled' && !p.enabled) return false;
      if (statusFilter === 'disabled' && p.enabled) return false;
      return true;
    });
  }, [projects, searchKeyword, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, statusFilter]);

  useEffect(() => {
    Promise.all([getProjects(), getSkills()]).then(([proj, sk]) => {
      setProjects(proj);
      setSkills(sk);
    }).catch(() => {
      alert('获取项目列表失败');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  async function handleSaveProject(id: string, data: Partial<ProjectFormData>) {
    await updateProject(id, data);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }

  async function handleCreateProject(data: ProjectConfig) {
    const created = await createProject(data);
    setProjects((prev) => [...prev, created]);
    setShowCreateModal(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">项目档案</h1>
        <p className="text-sm text-gray-500 mt-1">
          查看与编辑项目信息、匹配关键词与启用 Skills
        </p>
      </div>

      {/* 查询与筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索项目名称、简称、别名、关键词、ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已禁用</option>
        </select>
        <span className="text-sm text-gray-500">
          共 {filtered.length} 项
          {projects.length !== filtered.length && ` / 全部 ${projects.length} 项`}
        </span>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> 新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="w-8 h-8 mb-2" />
          <p className="text-sm">暂无项目配置</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          没有匹配「{searchKeyword || statusFilter !== 'all' ? '当前筛选' : ''}」的项目
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                    <th className="px-4 py-3 font-medium w-12">#</th>
                    <th className="px-4 py-3 font-medium w-20">ID</th>
                    <th className="px-4 py-3 font-medium min-w-[120px]">项目名称</th>
                    <th className="px-4 py-3 font-medium w-20">简称</th>
                    <th className="px-4 py-3 font-medium w-24 min-w-[5rem]">状态</th>
                    <th className="px-4 py-3 font-medium max-w-[140px]">别名</th>
                    <th className="px-4 py-3 font-medium max-w-[140px]">匹配关键词</th>
                    <th className="px-4 py-3 font-medium max-w-[160px]">Skills</th>
                    <th className="px-4 py-3 font-medium w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((project, idx) => (
                    <tr
                      key={project.id}
                      className="border-t border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-2.5 text-gray-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                        {project.id}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{project.shortName}</td>
                      <td className="px-4 py-2.5 w-24 min-w-[5rem]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            project.enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {project.enabled ? '已启用' : '已禁用'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-[140px] truncate" title={project.aliases.join(', ')}>
                        {project.aliases.length ? project.aliases.slice(0, 2).join(', ') + (project.aliases.length > 2 ? '…' : '') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-[140px] truncate" title={project.customerMatchKeywords.join(', ')}>
                        {project.customerMatchKeywords.length ? project.customerMatchKeywords.slice(0, 2).join(', ') + (project.customerMatchKeywords.length > 2 ? '…' : '') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-[160px] truncate" title={project.enabledSkills.join(', ')}>
                        {project.enabledSkills.length ? project.enabledSkills.slice(0, 2).join(', ') + (project.enabledSkills.length > 2 ? '…' : '') : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingProject(project)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 分页 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>共 {filtered.length} 条</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-gray-200 px-2 py-1 text-sm"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>每页 {n} 条</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}

      {editingProject && (
        <ProjectEditModal
          project={editingProject}
          skills={skills}
          onSave={handleSaveProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {showCreateModal && (
        <CreateProjectModal
          skills={skills}
          onSave={handleCreateProject}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
