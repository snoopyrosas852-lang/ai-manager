/**
 * API 环境配置
 * 当无后端或显式启用 Mock 时，直接使用 Mock 数据，避免无效请求
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === '1';

/** 是否应使用 Mock 数据（不请求后端） */
export function shouldUseMock(): boolean {
  return USE_MOCK || !BASE_URL.trim();
}
