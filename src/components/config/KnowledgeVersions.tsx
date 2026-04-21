import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Eye, RotateCcw, Loader2 } from 'lucide-react';
import { getKnowledgeVersions, rollbackKnowledgeBase } from '../../api/config';
import { useRole } from '../../hooks/useRole';
import type { KnowledgeVersion } from '../../types/config';

interface KnowledgeVersionsProps {
  kbId: string;
  onClose: () => void;
  onRollback: () => void;
}

export default function KnowledgeVersions({ kbId, onClose, onRollback }: KnowledgeVersionsProps) {
  const [versions, setVersions] = useState<KnowledgeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);
  const { isAdmin } = useRole();

  useEffect(() => {
    fetchVersions();
  }, [kbId]);

  async function fetchVersions() {
    setLoading(true);
    try {
      const data = await getKnowledgeVersions(kbId);
      setVersions(data);
    } catch {
      alert('获取版本历史失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback(versionId: string) {
    if (!confirm('确定要回滚到此版本？此操作将替换当前内容。')) return;
    setRollingBack(true);
    try {
      await rollbackKnowledgeBase(kbId, versionId);
      onRollback();
      onClose();
    } catch {
      alert('回滚失败');
    } finally {
      setRollingBack(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">版本历史</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">暂无版本记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">版本号</th>
                    <th className="px-4 py-3 font-medium">发布时间</th>
                    <th className="px-4 py-3 font-medium">发布人</th>
                    <th className="px-4 py-3 font-medium">备注</th>
                    <th className="px-4 py-3 font-medium w-32">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-mono text-gray-700">v{v.version}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(v.publishedAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{v.publishedBy}</td>
                      <td className="px-4 py-3 text-gray-500">{v.comment || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewContent(v.content)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" /> 查看
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleRollback(v.id)}
                              disabled={rollingBack}
                              className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> 回滚
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Version Preview Modal */}
        {previewContent !== null && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setPreviewContent(null)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">版本内容预览</h3>
                <button onClick={() => setPreviewContent(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Editor
                height="400px"
                language="json"
                value={previewContent}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13 }}
                theme="vs-dark"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
