/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基础地址，如 http://localhost:3001。为空时使用 Mock 数据 */
  readonly VITE_API_BASE_URL: string;
  /** 钉钉企业 CorpId，用于钉钉免登 */
  readonly VITE_DINGTALK_CORP_ID: string;
  /** 强制使用 Mock 数据，不请求后端（开发调试用） */
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
