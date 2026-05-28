# PRD: Trainer Meal Plans

Date: 2026-05-29
Status: Draft
Owner: Product + API + Frontend

## 1) Objective

Enable fitness trainers to create, personalize, and deliver weekly meal plans to clients with clear assignment and controlled edits.

## 2) Problem

Trainers currently cannot operationalize nutrition planning in EatMate. They need:

- weekly reusable templates
- assignment to multiple clients
- fast per-client tweaks without rebuilding full plans

## 3) Personas

- Primary: Fitness trainer / nutrition coach
- Secondary: Assigned client consuming plan in read-only mode

## 4) Success metrics

- At least 40% of trainer accounts create one weekly plan in first 14 days.
- At least 60% of created plans are assigned to at least one client.
- Median weekly plan creation time under 12 minutes after first use.

## 5) Scope (MVP)

- Create trainer plan (week, name, notes).
- Assign plan to one or more clients.
- Add day/slot recipes and per-client overrides (portion/substitution note).
- Duplicate prior week plan.
- Publish read-only version for client.

## 6) Non-goals (MVP)

- Billing or subscription management.
- Automated nutrition optimization.
- Chat-based trainer-client coaching inside planner.

## 7) Core user stories

1. As a trainer, I can create a weekly plan and fill meal slots with recipes.
2. As a trainer, I can assign one plan to multiple clients.
3. As a trainer, I can override serving size/note for a specific client.
4. As a client, I can open my assigned plan in read-only mode.

## 8) Functional requirements

- Plan type `trainer_plan`.
- Assignment field `assignedClientIds`.
- Client override support per entry.
- Roles:
  - trainer owner: full CRUD + publish
  - client: read-only on assigned plan
- Plan status: draft, published, archived.

## 9) UX requirements

- Trainer dashboard includes week switcher and client selector.
- Plan editor shows day columns and meal slots.
- Client view hides editing controls and shows trainer attribution.

## 10) API and data implications

- Extend `MealPlan` with `planType=trainer_plan` and assignment fields.
- Add assignment endpoints:
  - `POST /meal-plans/:id/assignments`
  - `DELETE /meal-plans/:id/assignments/:clientId`
- Enforce owner/consumer authorization checks.

## 11) Risks

- Unauthorized access to client plans.
- Plan complexity for large client sets.

Mitigation:

- Strict ownership checks and filtered query indexes.
- Bulk assignment UX and duplicate-from-template flow.

## 12) Rollout

1. Internal alpha with manual trainer role flag.
2. Limited beta with 5-10 trainers.
3. GA with analytics and operational monitoring.
