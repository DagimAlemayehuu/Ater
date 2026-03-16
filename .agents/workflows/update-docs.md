---
description: Update docs after completing a feature or fix
---

# Update Documentation Workflow

Run this workflow after completing ANY feature, fix, or significant change.

## Steps

1. **Add a changelog entry** in `docs/tracking/changelog.md`
   - Add a new section at the TOP of the file (reverse chronological)
   - Format: `## YYYY-MM-DD — Short Description`
   - List specific changes as bullet points

2. **Update project state** in `docs/tracking/project-state.md`
   - Check off completed items in the "Completed Phases" or "In Progress" sections
   - Update the "Feature Status Matrix" if a feature status changed
   - Add or modify entries in "Recent Activity" table
   - Update "Next Objectives" if priorities shifted

3. **Update backlog** in `docs/tracking/backlog.md`
   - Remove items that were completed
   - Reprioritize remaining items if needed
   - Add any new items discovered during development

4. **Update known issues** in `docs/tracking/known-issues.md` (if applicable)
   - Move fixed issues to the "Resolved Issues" table
   - Add any new issues discovered
   - Update workarounds if they changed

5. **Update architecture docs** (if structure changed)
   - `docs/architecture/frontend.md` — If routes, components, or contexts changed
   - `docs/architecture/backend.md` — If domains, endpoints, or workers changed
   - `docs/architecture/data-model.md` — If config schema, DB tables, or Notion DBs changed

6. **Update API reference** in `docs/api/endpoints.md` (if endpoints changed)
   - Add new endpoints with method, path, body, and response
   - Update existing endpoint documentation if behavior changed
   - Remove deprecated endpoints

7. **Verify completeness**
   - Read through `docs/README.md` to ensure all links are valid
   - Confirm the "Last Updated" date is current in tracking files
