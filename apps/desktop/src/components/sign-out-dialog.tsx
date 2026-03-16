export interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open }: SignOutDialogProps) {
  if (open) {
      return null
  }
  return null
}
