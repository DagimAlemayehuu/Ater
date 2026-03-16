const fs = require('fs');

// 1. sign-out-dialog.tsx
let content = fs.readFileSync('apps/desktop/src/components/sign-out-dialog.tsx', 'utf8');
content = `export interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog(props: SignOutDialogProps) {
  // Desktop app has no sign in right now
  const _open = props.open;
  return null
}
`;
fs.writeFileSync('apps/desktop/src/components/sign-out-dialog.tsx', content);
