## Manual UI Verification Checklist

- [ ] Open an AI Tutor explanation that returns a closed `<artifact>` block and confirm the right pane slides open automatically.
- [ ] Drag the split-pane handle left and right; confirm the iframe does not capture the pointer during resizing.
- [ ] Click the collapse button and confirm the chat returns to full width.
- [ ] Generate at least two artifacts in one conversation and confirm the artifact dropdown switches between them.
- [ ] Trigger a follow-up edit and confirm the version dropdown exposes the previous and current versions.
- [ ] Use Back and Next in the artifact footer and confirm chapter navigation updates the preview without resetting the chat.
- [ ] Return a `<sandbox-spec>` response and confirm lesson text renders immediately while the sandbox placeholder is visible.
- [ ] Confirm the generated sandbox replaces the placeholder after the background code-only request completes.
- [ ] Load a sandbox with a deliberate JavaScript error and confirm the "Self-healing in progress..." notification appears.
- [ ] Force three failed sandbox repairs and confirm the panel falls back to Code view with the raw code visible.
