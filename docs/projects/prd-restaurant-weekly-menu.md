# PRD: Restaurant Weekly Menu with Choices

Date: 2026-05-29
Status: Draft
Owner: Product + API + Frontend

## 1) Objective

Enable restaurant teams to publish weekly menus where each meal slot can offer multiple guest choices.

## 2) Problem

Restaurants need structured weekly menu planning and a simple guest-facing published view. Current EatMate planning is user-centric and does not support menu publishing workflows.

## 3) Personas

- Primary: Head chef / restaurant manager
- Secondary: Guest viewing menu

## 4) Success metrics

- At least 30% of restaurant accounts publish one full weekly menu in first month.
- At least 50% of published menus contain multi-choice slots.
- Menu page load p95 under 1.5 seconds on mobile.

## 5) Scope (MVP)

- Create plan type `restaurant_menu`.
- Add 1..N choices per slot (for example lunch option A/B/C).
- Publish/archive workflow.
- Share token link for read-only public menu page.

## 6) Non-goals (MVP)

- POS integration.
- Reservation integration.
- Dynamic pricing by time.

## 7) Core user stories

1. As a chef, I can prepare a weekly lunch/dinner menu with alternatives.
2. As a manager, I can publish and archive menu versions.
3. As a guest, I can access the published weekly menu from a share link.

## 8) Functional requirements

- Plan status lifecycle: draft -> published -> archived.
- Slot options with optional labels (`chef recommendation`, `vegetarian`).
- Share link token with optional expiration.
- Read-only public endpoint by token.

## 9) UX requirements

- Restaurant board defaults to lunch and dinner slots.
- Option cards are clearly grouped under each slot.
- Public page is lightweight and mobile-first.

## 10) API and data implications

- `MealPlan.planType = restaurant_menu`.
- `entries.options[]` with label and recipe.
- Endpoints:
  - `POST /meal-plans/:id/publish`
  - `POST /meal-plans/:id/archive`
  - `POST /meal-plans/:id/share-link`
  - `GET /meal-plans/shared/:token`

## 11) Risks

- Public link leakage.
- Incorrect menu version published.

Mitigation:

- Optional token expiry and revocation endpoint.
- Confirmation modal and version display before publish.

## 12) Rollout

1. Restaurant-only beta feature flag.
2. Publish/share endpoint hardening and monitoring.
3. Public launch with docs and onboarding.
