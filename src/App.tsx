import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CostDashboard from './components/CostDashboard';
import ToolManagement from './components/ToolManagement';
import KnowledgeBase from './components/KnowledgeBase';
import SessionAudit from './components/SessionAudit';

export default function App() {
  const [currentView, setCurrentView] = useState('cost');

  const renderContent = () => {
    switch (currentView) {
      case 'cost': return <CostDashboard />;
      case 'tools': return <ToolManagement />;
      case 'knowledge': return <KnowledgeBase />;
      case 'sessions': return <SessionAudit />;
      default: return <CostDashboard />;
    }
  };

  const breadcrumbMap: Record<string, string> = {
    cost: 'API 调用成本看板',
    tools: '工具管理',
    knowledge: '知识库管理',
    sessions: '会话管理',
  };

  return (
    <div className="flex h-screen bg-[#f3f5f9] text-slate-800 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={breadcrumbMap[currentView]} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
