# Feature Specification: Recipe Origin Highlight + Meal Plans + Professional Menus

Date: 2026-05-29
Status: Draft for review
Owner: Product + Frontend + API

## 1) Why this is a good idea

Both proposed features are strong product bets:

- Feature 1 improves trust and transparency around recipe origin.
- Feature 2 increases retention because users return to follow their weekly plan.
- Future AI meal-plan generation is a natural extension of your current AI direction.

Important legal note:
Visual differentiation alone does not fully solve copyright risk. It helps with transparency, but you still need explicit attribution metadata and clear content-source rules.

## 2) Scope overview

### New target personas (added)

- Individual users (existing B2C)
- Fitness trainers (B2B2C)
- Restaurant chefs/managers (B2B)

### Feature 1: Visually distinct recipes from famous chefs

Goal:
Users can immediately recognize recipes with external/famous-chef origin, including attribution and rights metadata.

MVP scope:

- Add recipe origin metadata to data model.
- Add visual treatment on recipe cards and recipe detail.
- Add attribution area (chef name/source link/license note).
- Add filters for source type in Discover page.

Out of scope (MVP):

- Automated legal validation service.
- Auto ingestion from licensed chef APIs.

### Feature 2: Weekly meal plans for authenticated users

Goal:
Authenticated users can create named weekly plans and assign recipes to days and meal slots.

MVP scope:

- CRUD meal plans.
- Each plan has a week range and name.
- Each day can contain multiple recipe entries by meal slot.
- Basic list/calendar style UI and drag/drop optional (phase 2).

Out of scope (MVP):

- Shopping list generation.
- Nutrition totals per day/week.
- Collaborative plans.

### Feature 3: Professional planning for trainers and restaurants

Goal:
Allow professionals to create and manage meal plans/menus for groups (clients or guests) with selectable options, including collaboration of multiple chefs on one plan.

MVP scope:

- Workspace mode for professional account.
- Two plan templates:
  - trainer_plan (client-oriented)
  - restaurant_menu (guest-facing)
- Weekly menu with selectable options per meal slot.
- Multi-chef collaboration on one restaurant menu plan.
- Publish state (draft | published | archived).

Out of scope (MVP):

- Billing/subscription logic.
- POS integration.
- Supplier ordering automation.
- Real-time cursor-level collaborative editing.

### Future scope: AI meal plan generation

Goal:
Generate meal plans from prompt (for example: kids camp, vegan restaurant, budget week, 3 options per meal).

Initial v2 scope:

- Prompt -> structured plan proposal.
- User can review/edit before save.
- Option mode: 1..N alternatives per slot.

## 3) Current-state fit (this codebase)

Observed from codebase:

- Recipe already has author and rich metadata, but no source attribution fields for external chef content.
- Recipe cards are centralized and reused in homepage/discover/favorites/my-recipes.
- No existing meal-plan domain in API or frontend.
- NestJS + Mongoose architecture is ready for adding a dedicated module.

Implication:

- Feature 1 is a low-to-medium change (mostly schema + DTO + UI).
- Feature 2 is medium-to-high change (new domain module end-to-end).

## 4) Functional requirements

## 4.1 Feature 1 requirements

FR1. Recipe origin classification

- Each recipe has sourceType:
  - user_original
  - inspired_by_chef
  - adapted_from_external
  - licensed_partner
- Default for user-created recipes: user_original.

FR2. Attribution metadata

- For non-user_original recipes, store:
  - sourceName (for example chef or publication)
  - sourceUrl (optional but recommended)
  - attributionText (short visible text)
  - rightsStatus (unknown | attributed | licensed)

FR3. Visual differentiation

- Recipe card style changes when sourceType != user_original.
- Recipe detail shows visible attribution block above ingredients/instructions.

FR4. Filtering and explainability

- Discover filter: sourceType.
- Tooltip or legend text to explain the visual badge.

FR5. Safety fallback

- If rightsStatus = unknown and sourceType is external, mark with warning badge for internal/admin view.

## 4.2 Feature 2 requirements

FR6. Meal plan creation

- Authenticated user can create plan with:
  - name
  - weekStartDate (ISO date, Monday-based normalization)
  - optional note

FR7. Meal plan structure

- Plan contains days (Monday..Sunday).
- Each day contains entries with:
  - mealSlot (breakfast, snack_1, lunch, snack_2, dinner, supper, custom)
  - recipeId
  - optional titleOverride
  - optional servingsOverride
  - optional note
  - optional position/order

FR8. Meal plan editing

- Add/remove/reorder entries.
- Move recipe entry between days.
- Rename plan.

FR9. Meal plan retrieval

- List user plans.
- Open single plan detail (week view).
- Duplicate previous week plan.

FR10. Authorization

- Users can only access their own meal plans.

## 4.3 Future AI requirements (phase 3)

FR11. Prompt-based generation

- Input: free-form prompt + optional constraints.
- Output: structured proposal compatible with meal plan schema.

FR12. Multi-option mode

- For each day+slot AI may return N alternatives.
- User chooses one or keeps alternatives.

FR13. Guardrails

- AI output must reference existing recipe IDs, or explicitly mark missing suggestions as external candidates.
- No silent overwrite of existing plan.

## 4.4 Professional requirements (trainers + restaurants)

FR14. Workspace ownership model

- Plan has ownerType: user | trainer | restaurant.
- ownerId references User now; organization entity can be introduced later without breaking API contract.

FR15. Target audience assignment (trainer)

- Trainer can assign plan to one or more clients.
- Per-client overrides are allowed for portion size and substitutions.

FR16. Weekly menu selections (restaurant)

- Restaurant can create day/slot menus with 1..N choices per slot.
- Each choice can include short label (for example: chef recommendation, vegetarian option).

FR17. Publish workflow

- Draft mode editable by owner.
- Published mode read-only for consumers (clients/guests) by default.
- Archived mode hidden from default listings.

FR18. Consumer view links

- Published plan/menu can be shared via secure read token link.
- Optional expiration date for shared link.

FR19. Chef collaboration on one plan

- Plan owner can invite multiple chef collaborators to a single restaurant menu plan.
- Collaborator roles for MVP: editor and viewer.
- Editors can update entries and options; viewers are read-only.

FR20. Concurrent edit safety

- API validates plan revision/version on write.
- If concurrent update conflict is detected, API returns conflict response and client must refresh/retry.

FR21. Change visibility

- Plan keeps lightweight lastModifiedBy and lastModifiedAt metadata.
- Optional activity log can be added in phase 2.

## 5) Non-functional requirements

- i18n: all new labels in en + cs.
- Performance: weekly plan page under 1.5s for normal account size.
- Accessibility: badges and attribution must be screen-reader readable.
- Data integrity: meal plan operations are idempotent where possible.
- Auditability: keep createdAt/updatedAt and optional generatedBy metadata for AI plans.
- Consistency under concurrency: no silent overwrite when two chefs edit the same plan.

## 6) Data model proposal

## 6.1 Recipe schema additions

Add to Recipe:

- sourceType: enum('user_original','inspired_by_chef','adapted_from_external','licensed_partner') default 'user_original'
- sourceName?: string
- sourceUrl?: string
- attributionText?: string
- rightsStatus: enum('unknown','attributed','licensed') default 'unknown'

Validation rule:

- If sourceType != 'user_original', require sourceName OR attributionText.

## 6.2 MealPlan schema (new)

MealPlan:

- \_id
- ownerType ('user' | 'trainer' | 'restaurant', default 'user')
- ownerId (ObjectId -> User)
- userIdLegacy?: ObjectId (optional compatibility alias during migration only)
- planType ('personal' | 'trainer_plan' | 'restaurant_menu', default 'personal')
- name (string, required)
- weekStartDate (Date, required)
- weekEndDate (Date, derived or stored)
- timezone (string, default Europe/Prague)
- note? (string)
- status ('draft' | 'published' | 'archived', default 'draft')
- assignedClientIds?: ObjectId[]
- collaborators?: [
  {
  userId: ObjectId,
  role: 'editor' | 'viewer',
  invitedAt: Date,
  acceptedAt?: Date
  }
  ]
- version: number (default 1, increment on each write)
- lastModifiedBy?: ObjectId
- lastModifiedAt?: Date
- share?: {
  token?: string,
  isPublic: boolean,
  expiresAt?: Date
  }
- entries: MealPlanEntry[]
- generatedBy?: {
  type: 'manual' | 'ai'
  prompt?: string
  model?: string
  generatedAt?: Date
  }
- createdAt
- updatedAt

MealPlanEntry:

- \_id
- date (Date, required)
- mealSlot (enum)
- recipeId (ObjectId -> Recipe)
- titleOverride?
- servingsOverride?
- note?
- audienceTag?: string
- options?: [
  {
  recipeId: ObjectId,
  reason?: string,
  label?: string
  }
  ]
- position (number)

Indexes:

- { ownerType: 1, ownerId: 1, weekStartDate: -1 }
- { ownerType: 1, ownerId: 1, name: 1 }
- { ownerType: 1, ownerId: 1, 'entries.date': 1 }
- { status: 1, 'share.token': 1 }

## 7) API design proposal

Base path: /meal-plans

Endpoints (MVP):

- POST /meal-plans
- GET /meal-plans?from=YYYY-MM-DD&to=YYYY-MM-DD
- GET /meal-plans/:id
- PATCH /meal-plans/:id
- DELETE /meal-plans/:id
- POST /meal-plans/:id/entries
- PATCH /meal-plans/:id/entries/:entryId
- DELETE /meal-plans/:id/entries/:entryId
- POST /meal-plans/:id/duplicate

Professional endpoints (MVP):

- POST /meal-plans/:id/publish
- POST /meal-plans/:id/archive
- POST /meal-plans/:id/share-link
- DELETE /meal-plans/:id/share-link
- GET /meal-plans/shared/:token
- POST /meal-plans/:id/collaborators
- PATCH /meal-plans/:id/collaborators/:collaboratorUserId
- DELETE /meal-plans/:id/collaborators/:collaboratorUserId

Future AI endpoints:

- POST /meal-plans/generate
- POST /meal-plans/:id/generate-options

API authorization:

- JWT required for all /meal-plans routes.
- Owner check on every read/write route.
- For collaboration routes: owner can manage collaborators; editor can modify content; viewer can read only.

## 8) Frontend UX proposal

## 8.1 Feature 1 UX

Recipe card:

- Add top-left badge for sourceType.
- Add subtle border style:
  - user_original: current default
  - inspired/adapted/licensed: highlighted border and soft tinted background
- Keep readability and contrast in light/dark theme.

Recipe detail:

- Attribution panel under title:
  - "Inspired by Chef X"
  - source link
  - rights badge (Attributed/Licensed)

Discover filter:

- Source filter chips/select integrated with existing filters.

## 8.2 Feature 2 UX

Navigation:

- New private route: /[language]/meal-plans

Screens:

- Meal plans list
- Create/Edit dialog
- Weekly board view (Mon-Sun rows or columns)

Interactions:

- Add recipe to slot from recipe detail and from recipe card quick action.
- Optional: drag/drop between slots in phase 2.

## 8.3 Feature 3 UX (professional)

Trainer mode:

- "My clients" selector in planner header.
- Quick duplicate plan from previous week per client.
- Per-client override chips (portion/substitution notes).

Restaurant mode:

- Weekly board focused on lunch/dinner service.
- Slot can expose multiple guest choices.
- Public menu view page with clean, mobile-first presentation.
- Collaborators panel with invited chefs, roles, and permissions.
- Conflict toast/modal when someone saved newer revision first.

## 9) Rollout plan

Phase A (1 sprint): Feature 1 foundation

- Schema + DTO + API response extension.
- Recipe card/detail visual differentiation.
- Discover filter by sourceType.
- Backfill script for existing recipes: default sourceType=user_original.

Phase B (1-2 sprints): Meal plans MVP

- New MealPlan module in API.
- Frontend pages + CRUD flows.
- Add-to-plan action from recipe detail.

Phase C (1 sprint): Professional MVP

- Owner model (trainer/restaurant) + planType.
- Publish/archive workflow.
- Shared read-only menu link.
- Multi-choice options per slot.
- Chef collaboration with role-based permissions and conflict handling.

Phase D (1 sprint): UX hardening

- Better week navigation, duplication, reorder.
- Add-to-plan action from recipe card.

Phase E (future): AI generation

- Prompt-to-plan pipeline.
- Alternatives per slot.
- Human-in-the-loop review screen.

## 10) Risks and mitigations

Risk 1: Legal misunderstanding (visual differentiation alone)

- Mitigation: enforce attribution metadata and rightsStatus policy in admin/editor flow.

Risk 2: Data inconsistency across locales

- Mitigation: meal plan stores recipeId only; localized text resolved at read time by language.

Risk 3: Scope explosion in AI phase

- Mitigation: strict MVP boundary, AI only after manual planner is stable.

Risk 4: UX complexity on mobile

- Mitigation: start with simple list/accordion day view; defer advanced drag/drop.

Risk 5: Role/permission complexity for professional accounts

- Mitigation: introduce clear RBAC matrix early (owner, editor, viewer) and cover with API integration tests.

Risk 6: Concurrent edits on same weekly menu

- Mitigation: version-based optimistic concurrency control and clear merge/retry UX.

## 11) Open product decisions needed

1. Do you want external/famous-chef recipes editable by users, or read-only?
2. Should users be allowed to share meal plans publicly?
3. Should one slot allow multiple selected recipes now, or use "options" only for AI phase?
4. Should week always start Monday regardless of locale?
5. Which label language should be shown if recipe locale differs from current UI locale?
6. Should trainer and restaurant capabilities be tied to role flags on User or to a dedicated Organization model now?
7. Should shared restaurant menus be indexable by search engines, or private-only by token?
8. How many collaborators should one plan support in MVP?
9. Should collaborator invitation require explicit accept flow or be immediate for existing users?

## 12) Acceptance criteria (MVP)

Feature 1 accepted when:

- New/existing recipes include sourceType.
- Non-user_original recipes are visually distinct on card and detail.
- Attribution info is visible where available.
- Discover can filter by sourceType.

Feature 2 accepted when:

- Authenticated user can create, rename, delete weekly plan.
- User can add multiple recipes per day with meal slots.
- User can edit and remove entries.
- Data is private per user and survives refresh/relogin.

Feature 3 accepted when:

- Trainer account can assign a weekly plan to at least one client.
- Restaurant account can publish a weekly menu with multiple choices in one slot.
- Published plan/menu can be opened in read-only mode using share token.
- Draft/published/archived status transitions are enforced by API.
- Plan owner can add at least one chef collaborator as editor.
- Two editor chefs can update one draft plan with conflict-safe behavior (no silent overwrite).

## 13) Suggested implementation order (technical)

1. API recipe schema + DTO extension for source metadata.
2. Frontend recipe type + recipe-card/detail rendering for source badges.
3. Discover filter plumbing for sourceType.
4. API MealPlan module (schema, service, controller, DTOs).
5. Frontend meal plan pages and forms.
6. Owner model + publish/share API and UI.
7. Collaboration endpoints + permission checks + version conflict flow.
8. Add-to-plan actions from recipe pages.
9. AI generation module (later).

---

Summary:

- The idea is strong and strategically aligned.
- Feature 1 should be framed as transparency and attribution, not complete legal protection.
- Feature 2 should launch manually first, then AI generation as phase 2/3 for best quality and lower risk.
- Professional scenarios (fitness trainers and restaurant weekly menus) fit naturally as an extension of the same meal-plan domain if owner model and publish flow are added early.
- Chef collaboration should be included in the professional MVP with simple RBAC and optimistic concurrency control.
