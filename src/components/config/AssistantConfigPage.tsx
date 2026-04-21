/**
 * 前台配置 - 欢迎语、意图改写、输入框工具栏（每项可配置可用 Skills）
 */
import { useState, useEffect } from 'react';
import { Loader2, Save, MessageSquare, Edit3, PackageSearch, Plus, Trash2 } from 'lucide-react';
import { getAssistantConfig, updateAssistantConfig, getSkills, getProjects } from '../../api/config';
import type { AssistantConfig, IntentRewriteRule, ToolbarItem, SkillConfig, ProjectConfig } from '../../types/config';

type TabId = 'welcome' | 'rewrite' | 'toolbar';

export default function AssistantConfigPage() {
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('welcome');

  useEffect(() => {
    Promise.all([getAssistantConfig(), getSkills(), getProjects()]).then(([cfg, sk, proj]) => {
      setConfig(cfg);
      setSkills(sk);
      setProjects(proj);
    }).catch(() => setConfig(null)).finally(() => setLoading(false));
  }, []);

  async function handleSave(partial: Partial<AssistantConfig>) {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateAssistantConfig(partial);
      setConfig(updated);
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中...
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'welcome', label: '欢迎语', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'rewrite', label: '意图改写', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'toolbar', label: '工具栏', icon: <PackageSearch className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">前台配置</h1>
        <p className="text-sm text-gray-500 mt-1">配置助理欢迎语、意图改写规则与输入框下方工具栏（及每项可用 Skills）</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id ? 'bg-white border border-b-0 border-gray-200 text-blue-600 -mb-px' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'welcome' && (
          <WelcomeEditor
            welcomeMessage={config.welcomeMessage}
            welcomeSubtext={config.welcomeSubtext}
            onSave={(welcomeMessage, welcomeSubtext) => handleSave({ welcomeMessage, welcomeSubtext })}
            saving={saving}
          />
        )}
        {activeTab === 'rewrite' && (
          <RewriteEditor
            rules={config.intentRewriteRules}
            skills={skills}
            projects={projects}
            onSave={(intentRewriteRules) => handleSave({ intentRewriteRules })}
            saving={saving}
          />
        )}
        {activeTab === 'toolbar' && (
          <ToolbarEditor
            toolbar={config.toolbar}
            skills={skills}
            onSave={(toolbar) => handleSave({ toolbar })}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeEditor({
  welcomeMessage,
  welcomeSubtext,
  onSave,
  saving,
}: {
  welcomeMessage: string;
  welcomeSubtext: string;
  onSave: (welcomeMessage: string, welcomeSubtext: string) => void;
  saving: boolean;
}) {
  const [msg, setMsg] = useState(welcomeMessage);
  const [sub, setSub] = useState(welcomeSubtext);
  useEffect(() => {
    setMsg(welcomeMessage);
    setSub(welcomeSubtext);
  }, [welcomeMessage, welcomeSubtext]);

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">欢迎语（首屏主文案）</label>
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="我是小仙，有什么我能帮你的吗？"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">副文案（引导选择工具）</label>
        <input
          type="text"
          value={sub}
          onChange={(e) => setSub(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请先选择下方工具，然后输入您的问题"
        />
      </div>
      <button
        type="button"
        onClick={() => onSave(msg, sub)}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        保存
      </button>
    </div>
  );
}

function RewriteEditor({
  rules,
  skills,
  projects,
  onSave,
  saving,
}: {
  rules: IntentRewriteRule[];
  skills: SkillConfig[];
  projects: ProjectConfig[];
  onSave: (intentRewriteRules: IntentRewriteRule[]) => void;
  saving: boolean;
}) {
  const [list, setList] = useState<IntentRewriteRule[]>(rules);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setList(rules);
  }, [rules]);

  function addRule() {
    setList((prev) => [
      ...prev,
      { id: `rule-${Date.now()}`, pattern: '', replacement: '', enabled: true },
    ]);
  }

  function removeRule(id: string) {
    setList((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function updateRule(id: string, patch: Partial<IntentRewriteRule>) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-1">
          用户问题匹配 pattern（正则）时可改写为 replacement；并可配置<strong>拆解结果</strong>：
          建议使用的工具、查哪个项目的数据、调用哪部分知识库，便于大模型先拆解再汇总数据给用户。
        </p>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" /> 新增规则
        </button>
      </div>
      <div className="overflow-x-auto space-y-2">
        {list.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[1fr 1fr auto auto] gap-2 items-center p-3 bg-gray-50/50">
              <div>
                <span className="text-xs text-gray-500 block mb-0.5">Pattern（正则）</span>
                <input
                  type="text"
                  value={r.pattern}
                  onChange={(e) => updateRule(r.id, { pattern: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm font-mono"
                  placeholder="违反.*红线"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-0.5">Replacement</span>
                <input
                  type="text"
                  value={r.replacement}
                  onChange={(e) => updateRule(r.id, { replacement: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                  placeholder="触碰红线的订单"
                />
              </div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => updateRule(r.id, { enabled: e.target.checked })}
                  className="rounded"
                />
                启用
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {expandedId === r.id ? '收起拆解' : '配置拆解'}
                </button>
                <button type="button" onClick={() => removeRule(r.id)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {expandedId === r.id && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">建议使用的工具（Skill）</label>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 ? (
                      <span className="text-gray-400 text-xs">暂无 Skill</span>
                    ) : (
                      skills.map((s) => (
                        <label key={s.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={r.suggestedSkillIds?.includes(s.id) ?? false}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(r.suggestedSkillIds ?? []), s.id]
                                : (r.suggestedSkillIds ?? []).filter((id) => id !== s.id);
                              updateRule(r.id, { suggestedSkillIds: next.length ? next : undefined });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{s.name}</span>
                          <span className="text-xs text-gray-400 font-mono">({s.id})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">建议查询的项目</label>
                  <select
                    value={r.suggestedProjectId ?? ''}
                    onChange={(e) => updateRule(r.id, { suggestedProjectId: e.target.value || undefined })}
                    className="rounded border border-gray-200 px-2 py-1.5 text-sm w-full max-w-xs"
                  >
                    <option value="">不指定</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">建议调用的知识库关键词（逗号分隔）</label>
                  <input
                    type="text"
                    value={(r.suggestedKnowledgeKeys ?? []).join(', ')}
                    onChange={(e) => {
                      const keys = e.target.value.split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean);
                      updateRule(r.id, { suggestedKnowledgeKeys: keys.length ? keys : undefined });
                    }}
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                    placeholder="考核红线, 违约金, 签收单"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSave(list)}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        <Save className="w-4 h-4" />
        保存
      </button>
    </div>
  );
}

function ToolbarEditor({
  toolbar,
  skills,
  onSave,
  saving,
}: {
  toolbar: ToolbarItem[];
  skills: SkillConfig[];
  onSave: (toolbar: ToolbarItem[]) => void;
  saving: boolean;
}) {
  const [list, setList] = useState<ToolbarItem[]>(toolbar);

  useEffect(() => {
    setList(toolbar);
  }, [toolbar]);

  function addTool() {
    setList((prev) => [
      ...prev,
      { id: `tool_${Date.now()}`, label: '新工具', skillIds: [] },
    ]);
  }

  function removeTool(id: string) {
    setList((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTool(id: string, patch: Partial<ToolbarItem>) {
    setList((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function toggleSkill(toolId: string, skillId: string) {
    setList((prev) =>
      prev.map((t) => {
        if (t.id !== toolId) return t;
        const has = t.skillIds.includes(skillId);
        return {
          ...t,
          skillIds: has ? t.skillIds.filter((s) => s !== skillId) : [...t.skillIds, skillId],
        };
      })
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">配置前台输入框下方展示的工具按钮；每项可勾选该工具可用的 Skills</p>
        <button
          type="button"
          onClick={addTool}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" /> 新增工具
        </button>
      </div>
      <div className="space-y-4">
        {list.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-gray-200 p-4 space-y-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={t.id}
                onChange={(e) => updateTool(t.id, { id: e.target.value })}
                className="rounded border border-gray-200 px-2 py-1.5 text-sm font-mono w-40"
                placeholder="order_query"
              />
              <span className="text-gray-400">显示名称</span>
              <input
                type="text"
                value={t.label}
                onChange={(e) => updateTool(t.id, { label: e.target.value })}
                className="rounded border border-gray-200 px-2 py-1.5 text-sm w-32"
                placeholder="订单查询"
              />
              <button
                type="button"
                onClick={() => removeTool(t.id)}
                className="text-gray-400 hover:text-red-600 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">可用 Skills：</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.length === 0 ? (
                  <span className="text-gray-400 text-sm">暂无 Skill 列表，请先在 Skill 管理中维护</span>
                ) : (
                  skills.map((s) => (
                    <label key={s.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.skillIds.includes(s.id)}
                        onChange={() => toggleSkill(t.id, s.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{s.name}</span>
                      <span className="text-xs text-gray-400 font-mono">({s.id})</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSave(list)}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        保存
      </button>
    </div>
  );
}
