import Editor from '@monaco-editor/react';

const PROMPT_SECTIONS = [
  {
    title: '意图识别 Prompt',
    content: `// Prompt 模板将从后端加载
// 此处为意图识别使用的 System Prompt 模板
// 包含：角色定义、Skill 列表、输出格式要求等`,
  },
  {
    title: 'Query 改写 Prompt',
    content: `// Prompt 模板将从后端加载
// 此处为 Query 改写使用的 System Prompt 模板
// 包含：改写规则、项目识别逻辑、澄清判断规则等`,
  },
  {
    title: '结果摘要 Prompt',
    content: `// Prompt 模板将从后端加载
// 此处为结果摘要使用的 System Prompt 模板
// 包含：摘要风格、格式要求、字段映射规则等`,
  },
];

export default function PromptViewer() {
  return (
    <div className="space-y-6">
      {PROMPT_SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{section.title}</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <Editor
              height="200px"
              language="markdown"
              value={section.content}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'off',
                wordWrap: 'on',
              }}
              theme="vs-dark"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
