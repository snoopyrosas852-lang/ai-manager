import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminLayout from './components/layout/AdminLayout';
import RoleGuard from './components/shared/RoleGuard';
import DevLogin from './pages/DevLogin';

// ---------------------------------------------------------------------------
// Lazy-loaded page components
// ---------------------------------------------------------------------------

const CostDashboard = React.lazy(() => import('./components/cost/CostDashboard'));
const SessionList = React.lazy(() => import('./components/sessions/SessionList'));
const SessionDetail = React.lazy(() => import('./components/sessions/SessionDetail'));
const PromptDebug = React.lazy(() => import('./components/debug/PromptDebug'));
const TestBench = React.lazy(() => import('./components/testbench/TestBench'));
const SkillManager = React.lazy(() => import('./components/config/SkillManager'));
const AssistantConfigPage = React.lazy(() => import('./components/config/AssistantConfigPage'));
const ProjectManager = React.lazy(() => import('./components/config/ProjectManager'));
const KnowledgeEditor = React.lazy(() => import('./components/config/KnowledgeEditor'));
const UserManager = React.lazy(() => import('./components/config/UserManager'));
const IntentSystemPage = React.lazy(() => import('./components/intent/IntentSystemPage'));
const QAKnowledgePage = React.lazy(() => import('./components/qa/QAKnowledgePage'));
const AgentConfigPage = React.lazy(() => import('./components/agent/AgentConfigPage'));
const ToolboxMarketPage = React.lazy(() => import('./components/toolbox/ToolboxMarketPage'));
const DepartmentKnowledgePage = React.lazy(() => import('./components/knowledge/DepartmentKnowledgePage'));
const ManagedCorpusPage = React.lazy(() => import('./components/knowledge/ManagedCorpusPage'));

// ---------------------------------------------------------------------------
// Route wrappers
// ---------------------------------------------------------------------------

function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="admin">{children}</RoleGuard>;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">403</h1>
      <p className="text-slate-500">您没有权限访问此页面</p>
    </div>
  );
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a31515] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<DevLogin />} />
            {/* Redirect root to /cost */}
            <Route path="/" element={<Navigate to="/cost" replace />} />

            {/* Admin layout shell */}
            <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
              {/* 数据监控 — admin + operator */}
              <Route path="/cost" element={<CostDashboard />} />
              <Route path="/sessions" element={<SessionList />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/toolbox-market" element={<ToolboxMarketPage />} />

              {/* 开发工具 — admin only */}
              <Route path="/debug" element={<AdminOnly><PromptDebug /></AdminOnly>} />
              <Route path="/testbench" element={<AdminOnly><TestBench /></AdminOnly>} />
              <Route path="/intent" element={<AdminOnly><IntentSystemPage /></AdminOnly>} />
              <Route path="/qa-knowledge" element={<AdminOnly><QAKnowledgePage /></AdminOnly>} />
              <Route path="/agent" element={<AdminOnly><AgentConfigPage /></AdminOnly>} />

              {/* 系统配置 */}
              <Route path="/config/assistant" element={<AdminOnly><AssistantConfigPage /></AdminOnly>} />
              <Route path="/config/skills" element={<AdminOnly><SkillManager /></AdminOnly>} />
              <Route path="/config/projects" element={<AdminOnly><ProjectManager /></AdminOnly>} />
              <Route path="/config/knowledge" element={<KnowledgeEditor />} />
              <Route
                path="/config/department-knowledge"
                element={<AdminOnly><DepartmentKnowledgePage /></AdminOnly>}
              />
              <Route
                path="/config/managed-corpus"
                element={<AdminOnly><ManagedCorpusPage /></AdminOnly>}
              />
              <Route path="/config/users" element={<AdminOnly><UserManager /></AdminOnly>} />

              {/* 无权限页 */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
