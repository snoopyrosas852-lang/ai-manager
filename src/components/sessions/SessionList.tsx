import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ThumbsUp, ThumbsDown, Minus, Eye, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import { getSessionList, exportSessionList, exportSessionDetail } from '../../api/sessions';
import type { SessionListItem, SessionFilter } from '../../types/session';

const PAGE_SIZE = 20;

const RATING_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'up', label: '好评' },
  { value: 'down', label: '差评' },
] as const;

function RatingBadge({ rating }: { rating: 'up' | 'down' | null }) {
  if (rating === 'up') return <ThumbsUp className="h-4 w-4 text-emerald-500" />;
  if (rating === 'down') return <ThumbsDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-300" />;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function SessionList() {
  const navigate = useNavigate();

  const [items, setItems] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [keyword, setKeyword] = useState('');
  const [rating, setRating] = useState<string>('');
  const [skill, setSkill] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState<'list' | 'detail' | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentFilter = useCallback((): SessionFilter => {
    const f: SessionFilter = { page: 1, pageSize: PAGE_SIZE, sortBy: 'createdAt', sortOrder: 'desc' };
    if (keyword) f.keyword = keyword;
    if (rating) f.rating = rating as SessionFilter['rating'];
    if (skill) f.skill = skill;
    if (projectId) f.projectId = projectId;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return f;
  }, [keyword, rating, skill, projectId, dateFrom, dateTo]);

  const fetchData = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const filter: SessionFilter = {
        page: currentPage,
        pageSize: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (keyword) filter.keyword = keyword;
      if (rating) filter.rating = rating as SessionFilter['rating'];
      if (skill) filter.skill = skill;
      if (projectId) filter.projectId = projectId;
      if (dateFrom) filter.dateFrom = dateFrom;
      if (dateTo) filter.dateTo = dateTo;

      const res = await getSessionList(filter);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, rating, skill, projectId, dateFrom, dateTo]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  function handleSearch(value: string) {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 400);
  }

  function handleFilterChange() {
    setPage(1);
  }

  function downloadBlob(blob: Blob, defaultName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportList() {
    setExporting('list');
    try {
      const filter = currentFilter();
      const blob = await exportSessionList(filter);
      const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').slice(0, 12);
      downloadBlob(blob, `sessions_${ts}.csv`);
    } catch (e) {
      console.error('导出失败', e);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportDetail() {
    setExporting('detail');
    try {
      const filter = currentFilter();
      const blob = await exportSessionDetail(filter);
      const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').slice(0, 12);
      downloadBlob(blob, `sessions_detail_${ts}.csv`);
    } catch (e) {
      console.error('导出明细失败', e);
    } finally {
      setExporting(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">会话审计</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportList}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting === 'list' ? '导出中…' : '导出'}
          </button>
          <button
            type="button"
            onClick={handleExportDetail}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exporting === 'detail' ? '导出中…' : '导出明细'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户或会话标题..."
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-sm">至</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={rating}
          onChange={(e) => { setRating(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Skill"
          value={skill}
          onChange={(e) => { setSkill(e.target.value); handleFilterChange(); }}
          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="项目 ID"
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); handleFilterChange(); }}
          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">会话标题</th>
              <th className="px-4 py-3 font-medium">消息数</th>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">费用(¥)</th>
              <th className="px-4 py-3 font-medium">评价</th>
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                    item.rating === 'down' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{item.userName}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-700">{item.title}</td>
                  <td className="px-4 py-3 text-gray-700">{item.messageCount}</td>
                  <td className="px-4 py-3 text-gray-700">{item.totalTokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">¥{item.totalCost.toFixed(2)}</td>
                  <td className="px-4 py-3"><RatingBadge rating={item.rating} /></td>
                  <td className="px-4 py-3">
                    {item.skill ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        {item.skill}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(item.createdAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/sessions/${item.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
