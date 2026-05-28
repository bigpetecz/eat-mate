# PRD: Chef Collaboration on Single Meal Plan

Date: 2026-05-29
Status: Draft
Owner: Product + API + Frontend

## 1) Objective

Allow multiple chefs to safely collaborate on a single weekly menu plan without accidental overwrite.

## 2) Problem

Restaurant planning is often team-based. One owner-only editor causes bottlenecks and stale plans. Teams need shared editing with role control and conflict-safe writes.

## 3) Personas

- Primary: Plan owner (head chef)
- Secondary: Collaborator chef (editor/viewer)

## 4) Success metrics

- At least 50% of restaurant menus include 2+ collaborators.
- Conflict error rate below 3% of write requests.
- 90% of conflict cases resolved on first retry.

## 5) Scope (MVP)

- Invite collaborators to one menu plan.
- Role-based permissions: editor/viewer.
- Optimistic concurrency with version checks.
- Conflict response and user-guided refresh/retry.

## 6) Non-goals (MVP)

- Google Docs style real-time cursor sync.
- In-app threaded comments.
- Cross-plan organization permission matrix.

## 7) Core user stories

1. As an owner, I can add/remove collaborator chefs on one plan.
2. As an owner, I can set collaborator role (editor/viewer).
3. As an editor chef, I can edit entries/options.
4. As an editor chef, I am warned when another chef saved a newer version.

## 8) Functional requirements

- `collaborators[]` on plan with role and invitation metadata.
- `version` number incremented on each successful update.
- Write endpoints require expected version.
- On mismatch return conflict (HTTP 409) with latest metadata.
- Authorization matrix:
  - owner: collaborator management + full plan actions
  - editor: content edits only
  - viewer: read only

## 9) UX requirements

- Collaborators panel in plan editor.
- Conflict banner/modal explaining who changed the plan and when.
- One-click reload latest + retry edit flow.

## 10) API and data implications

- Endpoints:
  - `POST /meal-plans/:id/collaborators`
  - `PATCH /meal-plans/:id/collaborators/:collaboratorUserId`
  - `DELETE /meal-plans/:id/collaborators/:collaboratorUserId`
- All update DTOs include `expectedVersion`.
- Add audit fields: `lastModifiedBy`, `lastModifiedAt`.

## 11) Risks

- Permission escalation bugs.
- Friction from too many conflict prompts.

Mitigation:

- Integration tests for RBAC matrix and edge cases.
- Autosave throttling + clear retry UX.

## 12) Rollout

1. Internal QA with simulated concurrent sessions.
2. Beta with selected restaurant teams.
3. GA after conflict and permission telemetry stabilizes.
