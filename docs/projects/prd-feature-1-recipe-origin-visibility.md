# Feature Spec: Recipe Origin Visibility

Date: 2026-05-29
Status: Proposed
Owner: Product + API + Frontend

## 1) Objective

Make recipe origin transparent by visually distinguishing recipes inspired by or sourced from famous chefs/external publishers, with clear attribution and rights metadata, while preventing the UI from overstating legal safety.

## 2) Problem

Users currently cannot identify recipe origin at a glance. This creates trust ambiguity, makes provenance harder to trust, and increases copyright/compliance risk when external inspiration exists.

## 3) Goals

- Increase transparency of recipe origin in all major recipe surfaces.
- Standardize attribution metadata for non-original recipes.
- Introduce a simple rights-status model for internal governance.
- Define a public publishing policy for externally inspired content.
- Provide an implementation-ready UI and API contract.

## 4) Non-goals

- Full legal copyright automation.
- Automated ingestion from licensed chef catalogs.
- Moderation workflow engine in MVP.
- Reproducing third-party article layouts, photos, or long-form editorial content.

## 5) Personas

- End user browsing recipes.
- Content editor/admin maintaining source attribution quality.
- Product/legal stakeholder monitoring rights status.
- API/frontend engineer implementing recipe origin handling.

## 6) Success metrics

- At least 95% of non-original recipes contain visible attribution block in recipe detail.
- At least 90% of recipe-card impressions for non-original recipes show distinct visual badge/treatment.
- 0 unresolved schema validation errors for required source metadata in newly created non-original recipes.
- Discover filter usage for sourceType reaches at least 10% of filter sessions after launch.
- 0 externally sourced recipes published without a defined `publicationEligibility` decision.

## 7) User stories

1. As a user, I can immediately see that a recipe is inspired by or adapted from a famous chef.
2. As a user, I can read attribution details and optionally open the source link.
3. As an editor, I can mark source type and rights status for each recipe.
4. As an admin, I can identify recipes with unknown rights status for follow-up.
5. As an engineer, I can implement the feature without open questions about payloads, UI states, or validation rules.

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
- If `sourceType = licensed_partner`, require `rightsStatus = licensed`.
- If `publicationEligibility = blocked`, recipe must not be shown in public recipe lists.

FR4. Recipe card visual distinction

- Non-original recipes use a distinct badge and subtle card treatment.
- Visual treatment remains accessible in light and dark themes.
- Visual treatment must not imply infringement or legal risk to the consumer.

FR5. Recipe detail attribution panel

- Show attribution panel below title and above ingredients/instructions.
- Include source label, optional link, and rights badge.
- Include concise provenance text readable in one scan on mobile.

FR6. Discover filter

- Add `sourceType` filter in Discover.
- Keep filter state in URL (consistent with current discover behavior).

FR7. Internal safety indicator

- For external source types with `rightsStatus=unknown`, expose warning marker in internal/admin surfaces.

FR8. Publication guardrail

- Introduce `publicationEligibility` for internal decisioning:
  - `public_allowed`
  - `review_required`
  - `blocked`
- Public recipe endpoints must not return `blocked` records.

FR9. Source disclosure copy

- UI labels must distinguish among `Inspired by`, `Adapted from`, and `Licensed from`.
- Avoid vague labels such as `Chef recipe` or `Official recipe` unless contractually true.

FR10. Authoring form coverage

- Both the add-new recipe flow and edit recipe flow must expose origin fields.
- Create and edit forms must use the same validation and helper-copy rules.
- Editing an existing recipe must preserve current origin values and allow safe reclassification.

## 9) Non-functional requirements

- Accessibility: badges and attribution panel are screen-reader readable and color contrast compliant.
- Performance: no measurable regression in recipe-card rendering throughput.
- Internationalization: all new labels translated to en and cs.
- Backward compatibility: existing recipes default to `sourceType=user_original`.
- Legal posture: consumer-facing UI must present provenance clearly without claiming legal compliance.
- Security: internal-only safety indicators must not leak through public/public-share endpoints.

## 10) Data model and API requirements

## 10.1 Data model changes

Recipe schema additions:

- `sourceType` enum, default `user_original`
- `sourceName` string
- `sourceUrl` string
- `attributionText` string
- `rightsStatus` enum, default `unknown`
- `publicationEligibility` enum, default `public_allowed` for `user_original`, otherwise `review_required`
- `sourceImportedAt` Date (optional)
- `sourceNotes` string (internal only, optional)

Migration/backfill:

- Existing recipes backfilled with:
  - `sourceType=user_original`
  - `rightsStatus=unknown` (or omitted if only used for non-original records)
  - `publicationEligibility=public_allowed`

Derived business rules:

- `user_original`:
  - `rightsStatus` may remain `unknown`
  - `publicationEligibility` defaults to `public_allowed`
- `inspired_by_chef` or `adapted_from_external`:
  - `publicationEligibility` defaults to `review_required`
- `licensed_partner`:
  - `rightsStatus` must be `licensed`
  - `publicationEligibility` may be `public_allowed`

## 10.2 Public API shape

Public recipe representation must include:

```json
{
  "id": "recipe_123",
  "title": "Tomato Pasta",
  "slug": "tomato-pasta",
  "sourceType": "adapted_from_external",
  "origin": {
    "label": "Adapted from",
    "sourceName": "Jamie Oliver",
    "sourceUrl": "https://example.com/original-recipe",
    "attributionText": "Adapted from a Jamie Oliver recipe",
    "rightsStatus": "attributed"
  }
}
```

Rules:

- `origin` is `null` for `user_original`.
- Public responses must not expose `publicationEligibility=blocked` recipes.
- Public responses must not include `sourceNotes`.

## 10.3 Internal API shape

Internal/editor responses additionally include:

```json
{
  "publicationEligibility": "review_required",
  "sourceNotes": "Rewritten from publisher article; needs legal review for photo usage"
}
```

## 10.4 API changes

- Extend create/update DTOs with source fields.
- Extend response DTO and list/select projections to include source fields.
- Ensure filters endpoint/query supports `sourceType`.

Suggested endpoint impacts:

- `GET /recipes/:language`
- `GET /recipes/:language/filter`
- `GET /recipes/:language/:slug`
- `POST /recipes`
- `PATCH /recipes/:id`

Detailed contract:

### `POST /recipes`

Request additions:

```json
{
  "sourceType": "inspired_by_chef",
  "sourceName": "Yotam Ottolenghi",
  "sourceUrl": "https://example.com/original",
  "attributionText": "Inspired by an Ottolenghi recipe",
  "rightsStatus": "attributed"
}
```

Validation:

- If `sourceType = user_original`, all source fields are optional.
- If `sourceType != user_original`, require `sourceName` or `attributionText`.
- If `sourceType = licensed_partner`, reject any payload where `rightsStatus != licensed`.
- Server assigns `publicationEligibility` based on policy unless internal admin explicitly overrides it.

Response additions:

```json
{
  "sourceType": "inspired_by_chef",
  "origin": {
    "label": "Inspired by",
    "sourceName": "Yotam Ottolenghi",
    "sourceUrl": "https://example.com/original",
    "attributionText": "Inspired by an Ottolenghi recipe",
    "rightsStatus": "attributed"
  }
}
```

### `PATCH /recipes/:id`

- Supports partial updates of all source fields.
- Re-evaluates `publicationEligibility` when `sourceType`, `rightsStatus`, or attribution fields change.
- Returns `409` if a future moderation/version system is introduced and a stale revision is submitted.

### `GET /recipes/:language`

- Include `sourceType` and `origin` summary required for card rendering.
- Exclude `blocked` recipes from public consumer list responses.

### `GET /recipes/:language/:slug`

- Include full `origin` block for detail rendering.
- If recipe is `blocked`, return `404` on public route.

### `GET /recipes/:language/filter`

Additional query parameter:

- `sourceType=user_original|inspired_by_chef|adapted_from_external|licensed_partner`

Optional future extension:

- `origin=external` as convenience alias mapping to all non-original source types.

Suggested validation errors:

```json
{
  "message": "Source attribution is required for non-original recipes",
  "errors": {
    "sourceName": ["Provide sourceName or attributionText when sourceType is not user_original"]
  }
}
```

## 10.5 Admin/internal endpoints

If admin surfaces are added in MVP or shortly after, prefer explicit internal endpoints rather than overloading public ones.

Suggested additions:

- `GET /internal/recipes?publicationEligibility=review_required`
- `PATCH /internal/recipes/:id/origin-review`

Example internal review payload:

```json
{
  "publicationEligibility": "public_allowed",
  "sourceNotes": "Text rewritten, no external photography, attribution confirmed"
}
```

## 11) UI specification

## 11.1 Shared UX principles

- Provenance UI should feel informational, not punitive.
- Badges must be short and localized.
- Consumers see provenance; editors see provenance plus safety state.
- External-origin recipes must be distinguishable without relying on color alone.

## 11.2 Recipe card UI

Consumer surfaces:

- Homepage recipe grids
- Discover results
- Favorites
- My recipes where public metadata is shown

Card behavior:

- `user_original`
  - Standard card, no provenance badge.
- `inspired_by_chef`
  - 1px accent border.
  - Badge: `Inspired by`.
  - Optional chef/publication sublabel only if it fits without wrapping awkwardly.
- `adapted_from_external`
  - Stronger accent border or left accent stripe.
  - Badge: `Adapted from`.
- `licensed_partner`
  - Accent border plus premium-style badge: `Licensed`.

Card copy rules:

- Badge text only on card, not long attribution copy.
- Source name can appear as one secondary text line if the layout already has supporting metadata space.
- Never show `rightsStatus=unknown` badge on consumer cards.

Accessibility rules:

- Badge text announced as part of card label.
- Border change must be paired with badge text.
- Maintain contrast ratio for badge foreground/background.

Responsive behavior:

- On mobile, preserve badge visibility without increasing card height more than one text row.
- If source name would overflow, hide it and keep badge only.

## 11.3 Recipe detail UI

Placement:

- Show provenance panel below title/meta area and above ingredients/instructions.

Consumer layout:

- Section label: `Recipe origin`
- Primary line examples:
  - `Inspired by Yotam Ottolenghi`
  - `Adapted from Jamie Oliver`
  - `Licensed from BBC Good Food`
- Optional secondary line: `This version is rewritten for Eat Mate.`
- Optional source CTA: `View original source`
- Rights badge displayed only as neutral informational pill:
  - `Attributed`
  - `Licensed`

Internal/admin additions:

- If `rightsStatus=unknown` or `publicationEligibility=review_required`, show internal warning chip.
- If `publicationEligibility=blocked`, show internal banner: `Blocked from public publishing`.

Interaction rules:

- Source link opens in a new tab.
- If no `sourceUrl`, panel still renders if `sourceName` or `attributionText` exists.
- If only `attributionText` exists, render that as the primary text.

## 11.4 Discover filter UI

Add source filter to existing discover controls.

Display labels:

- `Original`
- `Inspired by chef`
- `Adapted`
- `Licensed`

Behavior:

- Filter state persists in URL.
- Filter composes with current country/category/author filters.
- Empty state should explain the filter, for example: `No licensed recipes found for this filter combination.`

## 11.5 Recipe create/edit UI

Required surfaces:

- Add new recipe form
- Edit recipe form

Editor fields:

- Source type select
- Source name input
- Source URL input
- Attribution text textarea
- Rights status select

Dynamic validation:

- Hide or collapse source details when `sourceType=user_original`.
- When switching from `user_original` to any external type, reveal source fields immediately.
- Show inline validation if both `sourceName` and `attributionText` are empty.
- For `licensed_partner`, lock or auto-select `rightsStatus=licensed`.

Helper copy:

- `Use Inspired by for recipes substantially rewritten in your own words.`
- `Use Adapted from when the final recipe follows a known external source closely but is still your own authored version.`
- `Use Licensed when you have explicit rights to publish.`

## 12) Publication policy and legal guardrails

This feature improves transparency. It does not itself make copied content lawful to publish.

Operational policy:

1. Do not publicly publish copied third-party recipe text, editorial headnotes, or source photography unless licensed.
2. For non-licensed external sources, publish only your own rewritten recipe content and your own media.
3. Attribution is required for all non-original recipes, but attribution alone does not grant rights.
4. Never imply endorsement or partnership unless `sourceType=licensed_partner` and a real agreement exists.
5. Respect source-site terms of use and crawling restrictions outside this feature scope.

Publication decision matrix:

| sourceType            | rightsStatus | publicationEligibility default | Public allowed |
| --------------------- | ------------ | ------------------------------ | -------------- |
| user_original         | unknown      | public_allowed                 | Yes            |
| inspired_by_chef      | attributed   | review_required                | After review   |
| inspired_by_chef      | unknown      | review_required                | No             |
| adapted_from_external | attributed   | review_required                | After review   |
| adapted_from_external | unknown      | review_required                | No             |
| licensed_partner      | licensed     | public_allowed                 | Yes            |

Recommended internal rule:

- Anything externally sourced starts as `review_required` unless a license exists.
- Public APIs only serve records that are `public_allowed`.

## 13) Analytics and observability

Track events:

- `recipe_source_badge_impression`
- `recipe_source_attribution_open`
- `discover_filter_sourceType_applied`
- `recipe_origin_form_sourceType_changed`

Operational telemetry:

- Count of recipes by `sourceType` and `rightsStatus`.
- Count of recipes by `publicationEligibility`.
- Validation error counts for source metadata.
- Count of blocked recipes attempted on public fetch routes.

## 14) Implementation notes

API implementation outline:

- Extend recipe schema with new origin fields.
- Update create/update DTOs and response mapping.
- Add projection fields for list/detail endpoints.
- Add query filtering by `sourceType`.
- Add public filtering guard for `publicationEligibility != blocked`, and preferably only `public_allowed` if moderation is enforced immediately.

Frontend implementation outline:

- Extend recipe card model with `sourceType` and lightweight `origin` summary.
- Add provenance badge and border variant to shared recipe card component.
- Add recipe detail provenance panel component.
- Add create/edit source fields with localized labels and validation.
- Add discover source filter.

Suggested component splits:

- `RecipeOriginBadge`
- `RecipeOriginPanel`
- `RecipeOriginFields`

## 15) Risks and mitigation

Risk 1: Visual distinction interpreted as full legal compliance.

- Mitigation: keep publication policy explicit in internal/editor guidance and avoid compliance language in consumer UI.

Risk 2: Incomplete attribution data for migrated records.

- Mitigation: default migrated recipes to `user_original`; create review query for suspicious records if data import grows later.

Risk 3: UI clutter on recipe cards.

- Mitigation: keep one concise badge and one border treatment; reserve detailed provenance for detail page.

Risk 4: Editors select wrong source type.

- Mitigation: add inline helper text and admin review queue for non-original recipes.

Risk 5: Public endpoint leaks blocked content.

- Mitigation: centralize publication filter in service/query layer and cover with API tests.

## 16) Rollout plan

Phase 1 (backend foundation):

- Schema + DTO + query projection updates.
- Backfill migration.
- Public publication filter logic.

Phase 2 (frontend UI):

- Recipe card badge/treatment.
- Recipe detail attribution panel.
- Discover source filter.
- Create/edit origin fields.

Phase 3 (hardening):

- Internal warning visibility for unknown/review-required records.
- Analytics dashboards and quality checks.
- Optional internal moderation endpoints.

## 17) Acceptance criteria

1. Non-original recipes are visually distinct on recipe cards in all major listing pages.
2. Recipe detail shows provenance panel when `sourceType` is non-original.
3. Discover supports `sourceType` filtering and returns expected results.
4. API rejects invalid non-original payloads missing required attribution metadata.
5. Public recipe endpoints exclude records with `publicationEligibility=blocked`.
6. Existing recipes remain functional post-migration with no breaking client behavior.
7. Add-new recipe and edit recipe flows expose source fields with localized validation and helper text.

## 18) Open decisions

1. Should `review_required` recipes be fully hidden from consumers until approved, or visible only to their creators?
2. Do you want `publicationEligibility` exposed in admin-only UI immediately, or deferred behind a later moderation screen?
3. Should licensed-partner recipes have a distinct visual theme beyond badge/border, such as partner logo support?
4. Do you want an `external origin` grouped filter in addition to specific `sourceType` filters?
