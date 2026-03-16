const fs = require('fs');

// 1. sign-out-dialog.tsx
let content = `export interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open }: SignOutDialogProps) {
  if (open) {
      return null
  }
  return null
}
`;
fs.writeFileSync('apps/desktop/src/components/sign-out-dialog.tsx', content);
