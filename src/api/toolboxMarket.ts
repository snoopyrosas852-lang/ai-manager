import { http, getBlob } from './http';
import type { ToolboxMarketResponse } from '../types/toolboxMarket';

export async function fetchToolboxMarket(): Promise<ToolboxMarketResponse> {
  return http.get<ToolboxMarketResponse>('/api/admin/toolbox/market');
}

/** 导出应用上架统计 CSV（全量内存数据） */
export async function exportToolboxAppsCsv(): Promise<Blob> {
  return getBlob('/api/admin/toolbox/export/apps');
}

/** 导出意见箱 CSV（全量） */
export async function exportToolboxFeedbackCsv(): Promise<Blob> {
  return getBlob('/api/admin/toolbox/export/feedback');
}

/** 导出动态埋点流水 CSV（全量，含 open_tool / 任务进度等） */
export async function exportToolboxActivityCsv(): Promise<Blob> {
  return getBlob('/api/admin/toolbox/export/activity');
}
