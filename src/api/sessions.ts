import { http, getBlob } from './http';
import { shouldUseMock } from './env';
import type { SessionDetail, SessionFilter, SessionListItem } from '../types/session';
import { MOCK_SESSION_LIST, MOCK_SESSION_DETAIL } from './mockAdmin';

async function withMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  if (shouldUseMock()) return mock;
  try {
    return await fn();
  } catch {
    return mock;
  }
}

export async function getSessionList(
  filter: SessionFilter,
): Promise<{ items: SessionListItem[]; total: number }> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (filter.userName) params.userName = filter.userName;
  if (filter.dateFrom) params.dateFrom = filter.dateFrom;
  if (filter.dateTo) params.dateTo = filter.dateTo;
  if (filter.rating) params.rating = filter.rating;
  if (filter.skill) params.skill = filter.skill;
  if (filter.projectId) params.projectId = filter.projectId;
  if (filter.keyword) params.keyword = filter.keyword;
  if (filter.page !== undefined) params.page = filter.page;
  if (filter.pageSize !== undefined) params.pageSize = filter.pageSize;
  if (filter.sortBy) params.sortBy = filter.sortBy;
  if (filter.sortOrder) params.sortOrder = filter.sortOrder;

  return withMock(
    () =>
      http.get<{ items: SessionListItem[]; total: number }>(
        '/api/admin/sessions',
        params,
      ),
    { items: MOCK_SESSION_LIST, total: MOCK_SESSION_LIST.length }
  );
}

export async function getSessionDetail(id: string): Promise<SessionDetail> {
  return withMock(
    () => http.get<SessionDetail>(`/api/admin/sessions/${id}`),
    { ...MOCK_SESSION_DETAIL, session: { ...MOCK_SESSION_DETAIL.session, id } }
  );
}

/** 构建导出用查询参数（与列表筛选项一致），无筛选项即全量 */
function buildExportParams(filter: SessionFilter): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    sortBy: filter.sortBy || 'createdAt',
    sortOrder: filter.sortOrder || 'desc',
  };
  if (filter.keyword) params.keyword = filter.keyword;
  if (filter.dateFrom) params.dateFrom = filter.dateFrom;
  if (filter.dateTo) params.dateTo = filter.dateTo;
  if (filter.rating) params.rating = filter.rating;
  if (filter.skill) params.skill = filter.skill;
  if (filter.projectId) params.projectId = filter.projectId;
  return params;
}

/** 导出会话列表 CSV（有筛选项按筛选项，无则全量） */
export async function exportSessionList(filter: SessionFilter): Promise<Blob> {
  if (shouldUseMock()) {
    return new Blob(['\uFEFF用户,会话标题,消息数,Token,费用(¥),评价,Skill,时间\n'], { type: 'text/csv;charset=utf-8' });
  }
  return getBlob('/api/admin/sessions/export', buildExportParams(filter));
}

/** 导出会话明细 CSV（有筛选项按筛选项，无则全量） */
export async function exportSessionDetail(filter: SessionFilter): Promise<Blob> {
  if (shouldUseMock()) {
    return new Blob(['\uFEFF会话ID,用户,会话标题,会话时间,消息序号,角色,内容,消息类型,消息时间\n'], { type: 'text/csv;charset=utf-8' });
  }
  return getBlob('/api/admin/sessions/export/detail', buildExportParams(filter));
}
