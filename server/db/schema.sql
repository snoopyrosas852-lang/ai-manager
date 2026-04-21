-- 会话审计：demo 上报的会话与消息
-- 与需求文档中的 chat_sessions / messages 对齐，demo 阶段 user 用默认值

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              TEXT PRIMARY KEY,
  user_id         INTEGER NOT NULL DEFAULT 0,
  user_name       TEXT NOT NULL DEFAULT 'Demo用户',
  title           TEXT NOT NULL DEFAULT '新对话',
  message_count   INTEGER NOT NULL DEFAULT 0,
  total_tokens    INTEGER NOT NULL DEFAULT 0,
  total_cost      REAL NOT NULL DEFAULT 0,
  rating          TEXT,
  skill           TEXT,
  project_id      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  msg_type        TEXT NOT NULL DEFAULT 'text',
  card_data       TEXT,
  debug_info      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON chat_sessions(created_at);
