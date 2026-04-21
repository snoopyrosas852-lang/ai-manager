import { useState } from 'react';
import IntentTester from './IntentTester';
import RewriteTester from './RewriteTester';
import SummaryTester from './SummaryTester';
import PromptViewer from './PromptViewer';

const TABS = [
  { key: 'intent', label: '意图识别' },
  { key: 'rewrite', label: 'Query 改写' },
  { key: 'summary', label: '结果摘要' },
  { key: 'prompt', label: 'Prompt 查看' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function PromptDebug() {
  const [activeTab, setActiveTab] = useState<TabKey>('intent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Prompt 调试</h1>
        <p className="text-sm text-gray-500 mt-1">测试意图识别、Query 改写和结果摘要的 Prompt 效果</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'intent' && <IntentTester />}
        {activeTab === 'rewrite' && <RewriteTester />}
        {activeTab === 'summary' && <SummaryTester />}
        {activeTab === 'prompt' && <PromptViewer />}
      </div>
    </div>
  );
}
