# 管理后台 API 服务（会话审计）

- **数据**：JSON 文件 `./data/audit.json`，无需安装数据库
- **端口**：默认 `3101`，可通过 `PORT` 环境变量修改

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/sessions | 会话列表（分页、关键词、日期等筛选） |
| GET | /api/admin/sessions/:id | 会话详情（含消息） |
| POST | /api/admin/sessions/ingest | demo 前端上报会话（入库） |

## 启动

```bash
cd server
npm install
npm run dev
```

## 与前台配合

1. **后台前端**：在项目根目录 `.env` 或 `.env.local` 中设置 `VITE_API_BASE_URL=http://localhost:3101`，即可从 Mock 切到真实 API（否则会话审计页会一直显示 Mock 数据）。
2. **demo 前端**：在 assistant 的 `.env` 中设置 `VITE_AUDIT_API_URL=http://localhost:3101`，对话结束后会自动上报到本服务。

**看不到自己发的会话时请检查**：
- 本服务已启动（`npm run dev` 后终端有 “管理后台 API: http://localhost:3101”）。
- 管理后台前端的 `VITE_API_BASE_URL` 已设为 `http://localhost:3101` 并重启了前端。
- demo 前端的 `VITE_AUDIT_API_URL` 已设为 `http://localhost:3101` 并重启了前端。
- 在 demo 里发过至少一条消息并等 AI 回复完成；再打开或刷新管理后台的「会话审计」页。
