<!--
[TEMPLATE: THE GLOBAL TASK BOARD]
Instructions for the Architect Agent (Delete this block before use):
You MUST fill out this file based on the completed `.system/architecture/architecture.md`.
Break the project down into high-level Epics and group them STRICTLY by Agent Persona.
Do not use an "In Progress" section here. When an agent finishes, they move it to "Completed".
When a user asks for a new feature, append the Epic to the corresponding Agent's "Pending Epics" section.
-->

# Global Task Tracker
## 1. Database Agent (packages/database-orm)
### Pending Epics
> Major blocks of work that have not been finished and merged.

*   [ ] Define Schema: `User`, `Post`, `Comment` models in Prisma/SQLAlchemy.
*   [ ] Write initial migration and seed data.

### Completed Epics
> Moved here when the Agent has successfully merged the PR and the feature is verified.

*   *(Empty)*

---

## 2. Backend Agent (apps/backend-api)
### Pending Epics

*   [ ] Build CRUD routes for Users and Posts.
*   [ ] Implement JWT Authentication middleware.

### Completed Epics

*   *(Empty)*

---

## 3. Frontend Agent (apps/web-client)
### Pending Epics

*   [ ] Implement Landing Page `/`.
*   [ ] Implement Authentication Flow `/login` and `/register`.
*   [ ] Implement Dashboard `/dashboard` integrating with the Users/Posts API.

### Completed Epics

*   *(Empty)*

---

## 4. DevOps Agent (Infrastructure)
### Pending Epics

*   [ ] Setup Dockerfile for `backend-api` and `web-client`.
*   [ ] Configure GitHub Actions CI/CD pipeline.

### Completed Epics

*   *(Empty)*