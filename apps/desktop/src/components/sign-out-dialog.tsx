interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog(_props: SignOutDialogProps) {
  // Desktop app has no sign in right now
  return null
}
