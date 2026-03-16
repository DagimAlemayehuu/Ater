const fs = require('fs');

// 1. sign-out-dialog.tsx
let content = fs.readFileSync('apps/desktop/src/components/sign-out-dialog.tsx', 'utf8');
content = content.replace(/export function SignOutDialog\(\{.*?\}: SignOutDialogProps\) {/g, "export function SignOutDialog(_props: SignOutDialogProps) {");
fs.writeFileSync('apps/desktop/src/components/sign-out-dialog.tsx', content);
