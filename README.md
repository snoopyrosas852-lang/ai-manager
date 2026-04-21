# 小仙管理后台

> 咸亨小仙 AI 助理 — 管理后台（MVP）  
> 配套文档：《咸亨小仙AI助理_MVP需求文档_2人4周.md》第 4.6 节

## 技术栈

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4
- React Router v7
- Recharts（成本图表）
- Monaco Editor（知识库 JSON 编辑）

## 功能模块

| 模块 | 说明 | 权限 |
|------|------|------|
| 成本看板 | Token 消耗、费用统计、模型分布、Skill 分布、用户排行 | admin + operator（只读） |
| 会话审计 | 会话列表、多维筛选、会话详情（对话回放 + 调试面板） | admin + operator（只读） |
| Prompt 调试 | 意图识别、Query Rewriting、结果摘要测试 | admin |
| 测评工作台 | 测试用例 CRUD、批量执行、结果对比、历史记录 | admin |
| Skill 管理 | Skill 列表、启停控制 | admin |
| 项目档案 | 项目列表、客户匹配规则 | admin |
| 知识库编辑 | JSON 规则编辑、版本历史、发布/回滚 | admin + operator |
| 用户管理 | 用户列表、角色分配、项目映射 | admin |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
# 后端 API 地址（无后端时留空，将使用 Mock 数据）
# 会话审计数据：指向 server 服务（见下方「会话审计数据」）
VITE_API_BASE_URL=http://localhost:3101

# 钉钉 CorpId（钉钉免登用）
VITE_DINGTALK_CORP_ID=dingxxxxxxxx
```

**会话审计数据**：若需在「会话审计」中看到 demo 前台的会话记录，需先启动本仓库的 API 服务（`server/`），并在此处将 `VITE_API_BASE_URL` 设为 `http://localhost:3101`；同时在 demo 前台（assistant）配置 `VITE_AUDIT_API_URL=http://localhost:3101`，对话结束会自动上报。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3100（本机）或 http://你的局域网IP:3100（如 http://10.10.2.110:3100，供其他人访问）。

**使用会话审计真实数据**：在项目根目录执行 `cd server && npm install && npm run dev` 启动 API 服务（默认端口 3101），再在 `.env.local` 中设置 `VITE_API_BASE_URL=http://localhost:3101`。**若要让局域网其他人也能打开后台并看到会话审计等数据**，将 `VITE_API_BASE_URL` 改为本机局域网 IP，如 `http://10.10.2.110:3101`，然后重启前端。

### 4. 无后端开发模式

不配置 `VITE_API_BASE_URL` 或设置为空时，将自动使用 Mock 数据，无需启动后端即可预览全部功能。

也可显式设置 `VITE_USE_MOCK=true` 强制使用 Mock。

## 构建

```bash
npm run build
```

产物输出到 `dist/` 目录。

## 项目结构

```
src/
├── api/           # API 层（含 Mock 降级）
├── components/    # 页面组件
│   ├── cost/      # 成本看板
│   ├── sessions/  # 会话审计
│   ├── debug/     # Prompt 调试
│   ├── testbench/ # 测评工作台
│   ├── config/    # 系统配置
│   ├── layout/    # 布局
│   └── shared/    # 通用组件
├── hooks/         # useAuth, useRole
├── pages/         # 登录页等
└── types/         # 类型定义
```

## 相关仓库

- 前台助理：https://github.com/snoopyrosas852-lang/assistant.git
- 后台仓库：https://github.com/snoopyrosas852-lang/ai-manager.git（本仓库）
