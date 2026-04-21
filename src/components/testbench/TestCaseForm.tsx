import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X } from 'lucide-react';
import type { TestCase } from '../../types/testcase';

const PROJECTS = [
  { value: '', label: '无' },
  { value: 'zhongchuan', label: '中船' },
  { value: 'guanwang', label: '管网' },
  { value: 'guowang', label: '国网' },
];

const SKILLS = [
  'query_contract',
  'query_payment',
  'query_delivery',
  'query_invoice',
  'query_project',
];

interface TestCaseFormProps {
  testCase?: TestCase | null;
  onSave: (data: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export default function TestCaseForm({ testCase, onSave, onClose }: TestCaseFormProps) {
  const [group, setGroup] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [expectedSkill, setExpectedSkill] = useState<string>(SKILLS[0]);
  const [expectedIntent, setExpectedIntent] = useState('');
  const [expectedParams, setExpectedParams] = useState('{}');

  useEffect(() => {
    if (testCase) {
      setGroup(testCase.group);
      setUserMessage(testCase.userMessage);
      setProjectContext(testCase.projectContext ?? '');
      setExpectedSkill(testCase.expected.skill ?? '');
      setExpectedIntent(testCase.expected.intent);
      setExpectedParams(JSON.stringify(testCase.expected.params ?? {}, null, 2));
    }
  }, [testCase]);

  function handleSubmit() {
    let params: Record<string, any> = {};
    try {
      params = JSON.parse(expectedParams);
    } catch {
      alert('期望参数 JSON 格式错误');
      return;
    }

    onSave({
      group,
      userMessage,
      projectContext: projectContext || undefined,
      expected: {
        skill: expectedSkill || null,
        intent: expectedIntent,
        params,
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {testCase ? '编辑用例' : '新建用例'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分组名</label>
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="例如: 合同查询"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户输入</label>
          <textarea
            rows={3}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="输入测试用例的用户消息..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目上下文</label>
          <select
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望 Skill</label>
          <select
            value={expectedSkill}
            onChange={(e) => setExpectedSkill(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">无</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望 Intent</label>
          <input
            value={expectedIntent}
            onChange={(e) => setExpectedIntent(e.target.value)}
            placeholder="例如: search_contract"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望参数 (JSON)</label>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <Editor
              height="120px"
              language="json"
              value={expectedParams}
              onChange={(v) => setExpectedParams(v ?? '{}')}
              options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 12, tabSize: 2, lineNumbers: 'off' }}
              theme="vs-dark"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!group.trim() || !userMessage.trim() || !expectedIntent.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
