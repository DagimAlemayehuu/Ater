const fs = require('fs');

// 1. sign-out-dialog.tsx
let content = fs.readFileSync('apps/desktop/src/components/sign-out-dialog.tsx', 'utf8');
content = content.replace(/_props/g, "onOpenChange");
fs.writeFileSync('apps/desktop/src/components/sign-out-dialog.tsx', content);

// 2. agent-detail.tsx
content = fs.readFileSync('apps/desktop/src/routes/agent-detail.tsx', 'utf8');
content = content.replace(/agentsData\.find\(\(a: any\)/g, "agentsData.find((a: { id: string, name: string, role: string, status: string, description: string, icon: any })");
fs.writeFileSync('apps/desktop/src/routes/agent-detail.tsx', content);

// 3. automation-detail.tsx
content = fs.readFileSync('apps/desktop/src/routes/automation-detail.tsx', 'utf8');
content = content.replace(/automationsData\.find\(\(a: any\)/g, "automationsData.find((a: { id: string, name: string, status: string, lastRun: string, type: string, icon: any })");
fs.writeFileSync('apps/desktop/src/routes/automation-detail.tsx', content);
