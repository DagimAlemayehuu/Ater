# [AUTORUN DIRECTIVE]: SECURITY AUDIT & HANDOVER
> **IF YOU ARE READING THIS, THE PROJECT IS REACHING COMPLETION.**
> You must perform a rigorous, deterministic audit before human deployment.

## EXECUTION STEPS:
1. **The Secret Sweep:** Scan the repository for hardcoded secrets, exposed API keys, and accidentally committed `.env` variables (check `NEXT_PUBLIC_` or `VITE_` variables specifically).
2. **The Security Gate:** Verify that all database migration scripts enforce strict security (e.g., explicit Row Level Security, no destructive drops without backups).
3. **The Type Gate:** Execute the global typecheck (`pnpm turbo run typecheck`). The exit code MUST be 0. 
4. **Documentation:** Generate or update `docs/handover/ADMIN_MANUAL.md` containing instructions on:
   - Required environment variables.
   - Local startup commands.
   - Deployment architecture.
5. **Completion:** Output exactly: "Audit complete. Admin Manual generated. System is ready for production deployment."