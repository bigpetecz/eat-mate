# PRD: Visually Distinct Recipes from Famous Chefs

Date: 2026-05-29
Status: Draft
Owner: Product + API + Frontend

## 1) Objective

Make recipe origin transparent by visually distinguishing recipes inspired by or sourced from famous chefs/external publishers, with clear attribution and rights metadata.

## 2) Problem

Users currently cannot identify recipe origin at a glance. This creates trust ambiguity and increases copyright/compliance risk when external inspiration exists.

## 3) Goals

- Increase transparency of recipe origin in all major recipe surfaces.
- Standardize attribution metadata for non-original recipes.
- Introduce a simple rights-status model for internal governance.

## 4) Non-goals

- Full legal copyright automation.
- Automated ingestion from licensed chef catalogs.
- Moderation workflow engine in MVP.

## 5) Personas

- End user browsing recipes.
- Content editor/admin maintaining source attribution quality.
- Product/legal stakeholder monitoring rights status.

## 6) Success metrics

- At least 95% of non-original recipes contain visible attribution block in recipe detail.
- At least 90% of recipe-card impressions for non-original recipes show distinct visual badge/treatment.
- 0 unresolved schema validation errors for required source metadata in newly created non-original recipes.
- Discover filter usage for sourceType reaches at least 10% of filter sessions after launch.

## 7) User stories

1. As a user, I can immediately see that a recipe is inspired by or adapted from a famous chef.
2. As a user, I can read attribution details and optionally open the source link.
3. As an editor, I can mark source type and rights status for each recipe.
4. As an admin, I can identify recipes with unknown rights status for follow-up.

## 8) Functional requirements

FR1. Source classification

- Each recipe has `sourceType`:
  - `user_original`
  - `inspired_by_chef`
  - `adapted_from_external`
  - `licensed_partner`

FR2. Attribution metadata

- For `sourceType != user_original`, store:
  - `sourceName` (chef/publication)
  - `sourceUrl` (optional but recommended)
  - `attributionText` (short text shown in UI)
  - `rightsStatus` (`unknown` | `attributed` | `licensed`)

FR3. Validation

- If `sourceType != user_original`, require `sourceName` or `attributionText`.
- Validation enforced on create and update.

FR4. Recipe card visual distinction

- Non-original recipes use a distinct badge and subtle card treatment.
- Visual treatment remains accessible in light and dark themes.

FR5. Recipe detail attribution panel

- Show attribution panel below title and above ingredients/instructions.
- Include source label, optional link, and rights badge.

FR6. Discover filter

- Add `sourceType` filter in Discover.
- Keep filter state in URL (consistent with current discover behavior).

FR7. Internal safety indicator

- For external source types with `rightsStatus=unknown`, expose warning marker in internal/admin surfaces.

## 9) Non-functional requirements

- Accessibility: badges and attribution panel are screen-reader readable and color contrast compliant.
- Performance: no measurable regression in recipe-card rendering throughput.
- Internationalization: all new labels translated to en and cs.
- Backward compatibility: existing recipes default to `sourceType=user_original`.

## 10) Data model and API requirements

## 10.1 Data model changes

Recipe schema additions:

- `sourceType` enum, default `user_original`
- `sourceName` string
- `sourceUrl` string
- `attributionText` string
- `rightsStatus` enum, default `unknown`

Migration/backfill:

- Existing recipes backfilled with:
  - `sourceType=user_original`
  - `rightsStatus=unknown` (or omitted if only used for non-original records)

## 10.2 API changes

- Extend create/update DTOs with source fields.
- Extend response DTO and list/select projections to include source fields.
- Ensure filters endpoint/query supports `sourceType`.

Suggested endpoint impacts:

- `GET /recipes/:language`
- `GET /recipes/:language/filter`
- `GET /recipes/:language/:slug`
- `POST /recipes`
- `PATCH /recipes/:id`

## 11) UX requirements

Recipe card:

- Badge at top-left with localized source label.
- Subtle border/background variant for non-original records.

Recipe detail:

- Attribution component with:
  - source summary text
  - optional source URL CTA
  - rights status badge

Discover:

- Source filter integrated with existing filter controls.

## 12) Analytics and observability

Track events:

- `recipe_source_badge_impression`
- `recipe_source_attribution_open`
- `discover_filter_sourceType_applied`

Operational telemetry:

- Count of recipes by `sourceType` and `rightsStatus`.
- Validation error counts for source metadata.

## 13) Risks and mitigation

Risk 1: Visual distinction interpreted as full legal compliance.

- Mitigation: keep explicit legal note in admin/editor guidelines and enforce metadata policy.

Risk 2: Incomplete attribution data for migrated records.

- Mitigation: default migrated recipes to `user_original`; introduce admin review queue for flagged records.

Risk 3: UI clutter on recipe cards.

- Mitigation: keep one concise badge and subtle styling; avoid stacked warning chips in consumer view.

## 14) Rollout plan

Phase 1 (backend foundation):

- Schema + DTO + query projection updates.
- Backfill migration.

Phase 2 (frontend UI):

- Recipe card badge/treatment.
- Recipe detail attribution panel.
- Discover source filter.

Phase 3 (hardening):

- Internal warning visibility for unknown rights.
- Analytics dashboards and quality checks.

## 15) Acceptance criteria

1. Non-original recipes are visually distinct on recipe cards in all major listing pages.
2. Recipe detail shows attribution panel when sourceType is non-original.
3. Discover supports sourceType filtering and returns expected results.
4. API rejects invalid non-original payloads missing required attribution metadata.
5. Existing recipes remain functional post-migration with no breaking client behavior.
