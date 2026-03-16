const fs = require('fs');

// 1. sign-out-dialog.tsx
let content = fs.readFileSync('apps/desktop/src/components/sign-out-dialog.tsx', 'utf8');
content = content.replace(/export function SignOutDialog\(onOpenChange: SignOutDialogProps\) {/g, "export function SignOutDialog({}: SignOutDialogProps) {");
fs.writeFileSync('apps/desktop/src/components/sign-out-dialog.tsx', content);

// 2. agent-detail.tsx
content = fs.readFileSync('apps/desktop/src/routes/agent-detail.tsx', 'utf8');
content = content.replace(/\{ id: string, name: string, role: string, status: string, description: string, icon: any \}/g, "Record<string, unknown>");
fs.writeFileSync('apps/desktop/src/routes/agent-detail.tsx', content);

// 3. automation-detail.tsx
content = fs.readFileSync('apps/desktop/src/routes/automation-detail.tsx', 'utf8');
content = content.replace(/\{ id: string, name: string, status: string, lastRun: string, type: string, icon: any \}/g, "Record<string, unknown>");
fs.writeFileSync('apps/desktop/src/routes/automation-detail.tsx', content);
