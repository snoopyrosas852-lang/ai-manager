/**
 * 百宝箱看板：按工具呈现打开量、任务量；右侧为百宝箱意见箱
 */

import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Store,
  MousePointerClick,
  PlayCircle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Mailbox,
  Download,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  fetchToolboxMarket,
  exportToolboxAppsCsv,
  exportToolboxFeedbackCsv,
  exportToolboxActivityCsv,
} from '../../api/toolboxMarket';
import type { ToolboxAppStat, ToolboxMarketResponse } from '../../types/toolboxMarket';

const APPS_PAGE_SIZE = 20;

const CATEGORY_LABEL: Record<string, string> = {
  pdf: 'PDF',
  excel: 'Excel',
  word: 'Word',
  image: '图片',
  other: '跨格式/通用',
  xhmall_ops: '咸亨运营',
};

function categoryBadge(category: string) {
  const label = CATEGORY_LABEL[category] || category;
  return (
    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
      {label}
    </span>
  );
}

function formatTime(ts: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-CN');
}

function exportTimestampForFilename() {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').slice(0, 12);
}

function downloadBlob(blob: Blob, defaultName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ToolboxMarketPage() {
  const [data, setData] = useState<ToolboxMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'apps' | 'feedback' | 'activity' | null>(null);
  const [appsPage, setAppsPage] = useState(1);

  const load = () => {
    setLoading(true);
    setErr(null);
    fetchToolboxMarket()
      .then((d) => {
        setData(d);
        setAppsPage(1);
      })
      .catch((e: Error) => setErr(e.message || '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const totals = data?.totals;
  const apps = data?.apps ?? [];
  const appsTotalPages = Math.max(1, Math.ceil(apps.length / APPS_PAGE_SIZE));
  const appsPageClamped = Math.min(appsPage, appsTotalPages);
  const appsSlice = apps.slice(
    (appsPageClamped - 1) * APPS_PAGE_SIZE,
    appsPageClamped * APPS_PAGE_SIZE,
  );

  useEffect(() => {
    if (appsPage > appsTotalPages) setAppsPage(appsTotalPages);
  }, [appsPage, appsTotalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-[#a31515] flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 truncate">
            百宝箱
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <div
            className="flex rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden divide-x divide-slate-200"
            role="group"
            aria-label="导出 CSV"
          >
            <button
              type="button"
              onClick={async () => {
                setExporting('apps');
                setErr(null);
                try {
                  const blob = await exportToolboxAppsCsv();
                  downloadBlob(blob, `toolbox_apps_${exportTimestampForFilename()}.csv`);
                } catch (e) {
                  console.error(e);
                  setErr((e as Error).message || '导出应用列表失败');
                } finally {
                  setExporting(null);
                }
              }}
              disabled={!!exporting}
              title="导出应用上架统计"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              {exporting === 'apps' ? '…' : '应用'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setExporting('feedback');
                setErr(null);
                try {
                  const blob = await exportToolboxFeedbackCsv();
                  downloadBlob(blob, `toolbox_feedback_${exportTimestampForFilename()}.csv`);
                } catch (e) {
                  console.error(e);
                  setErr((e as Error).message || '导出意见箱失败');
                } finally {
                  setExporting(null);
                }
              }}
              disabled={!!exporting}
              title="导出意见箱"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
            >
              <Mailbox className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#a31515]" />
              {exporting === 'feedback' ? '…' : '意见'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setExporting('activity');
                setErr(null);
                try {
                  const blob = await exportToolboxActivityCsv();
                  downloadBlob(blob, `toolbox_activity_${exportTimestampForFilename()}.csv`);
                } catch (e) {
                  console.error(e);
                  setErr((e as Error).message || '导出动态流水失败');
                } finally {
                  setExporting(null);
                }
              }}
              disabled={!!exporting}
              title="导出动态埋点流水（打开/任务进度等）"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
            >
              <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              {exporting === 'activity' ? '…' : '流水'}
            </button>
          </div>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">累计打开</p>
              <p className="text-2xl font-bold text-slate-900">{totals.opens}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">已发起处理</p>
              <p className="text-2xl font-bold text-slate-900">{totals.jobStarts}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">已完成任务</p>
              <p className="text-2xl font-bold text-slate-900">{totals.jobCompletes}</p>
            </div>
          </div>
        </div>
      )}

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">{err}</div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-20 text-slate-400 text-sm">加载中…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              应用上架列表
            </h2>
            {!apps.length ? (
              <div className="rounded-xl bg-white border border-dashed border-slate-200 p-12 text-center text-slate-500 text-sm">
                暂无上报数据。请启动小仙助理（含百宝箱）并在 assistant 服务端配置{' '}
                <code className="text-xs bg-slate-100 px-1 rounded">ADMIN_API_URL</code> 指向本管理 API。
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-medium text-slate-600">
                        <th className="px-4 py-3 whitespace-nowrap">工具名称</th>
                        <th className="px-4 py-3 whitespace-nowrap">工具 ID</th>
                        <th className="px-4 py-3 whitespace-nowrap">分类</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">打开</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">任务</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">完成</th>
                        <th className="px-4 py-3 whitespace-nowrap">最近活跃</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appsSlice.map((app: ToolboxAppStat) => (
                        <tr
                          key={app.toolId}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate" title={app.toolName}>
                            {app.toolName}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[160px] truncate" title={app.toolId}>
                            {app.toolId}
                          </td>
                          <td className="px-4 py-3">{categoryBadge(app.category)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800">{app.opens}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800">{app.jobStarts}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">{app.jobCompletes}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{formatTime(app.lastAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-600">
                  <span className="tabular-nums">
                    共 {apps.length} 条，每页 {APPS_PAGE_SIZE} 条
                    {appsTotalPages > 1 ? ` · 第 ${appsPageClamped} / ${appsTotalPages} 页` : null}
                  </span>
                  {appsTotalPages > 1 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={appsPageClamped <= 1}
                        onClick={() => setAppsPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg p-2 text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="上一页"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={appsPageClamped >= appsTotalPages}
                        onClick={() => setAppsPage((p) => Math.min(appsTotalPages, p + 1))}
                        className="rounded-lg p-2 text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="下一页"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mailbox className="w-4 h-4 text-[#a31515]" />
              百宝箱意见箱
            </h2>
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden max-h-[560px] overflow-y-auto">
              {!(data?.feedback && data.feedback.length) ? (
                <p className="p-6 text-sm text-slate-400 text-center leading-relaxed">
                  暂无意见。用户需在小仙助理工作台 · 百宝箱中点击「百宝箱意见箱」提交后，将显示在此。
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(data?.feedback ?? []).map((row, i) => (
                    <li key={`${row.at}-fb-${i}`} className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] text-slate-400 shrink-0">{formatTime(row.at)}</span>
                      </div>
                      <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {row.text}
                      </p>
                      {(row.contact || row.clientHint) && (
                        <p className="text-xs text-slate-400 mt-2 space-x-2">
                          {row.contact ? <span>联系：{row.contact}</span> : null}
                          {row.clientHint ? (
                            <span className="font-mono">端 {row.clientHint}</span>
                          ) : null}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
