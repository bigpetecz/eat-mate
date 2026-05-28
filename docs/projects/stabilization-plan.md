**Findings (ordered by severity)**

1. Critical: Core auth flows are currently inconsistent/broken between frontend and backend.

- Signup payload does not match backend contract: frontend sends name/email/password (page.tsx, page.tsx), while backend expects googleId/email/password/displayName (auth.controller.ts, auth.controller.ts, auth.controller.ts).
- Login form has no submit handler despite a submit button (login-client.tsx, login-client.tsx).
- Google login button uses redirect in client click flow, which is fragile and not the normal client-navigation pattern (login-client.tsx).

2. High: Potential sensitive user-data leakage from auth endpoint.

- Me endpoint returns findUserByEmail directly (auth.controller.ts, auth.controller.ts, auth.service.ts).
- User schema includes password field without select false protection (user.schema.ts, user.schema.ts).

3. High: Route protection and localization redirects have correctness bugs.

- Protected-route redirect points to /{locale}/login, but localized login route is sign-in/prihlasit-se (middleware.ts, i18n.ts, i18n.ts).
- Recipe edit route protection uses wildcard string in startsWith logic, so it will not match real paths reliably (middleware.ts, middleware.ts).
- Locale resolver login regex uses prihlaseni, but route key defines prihlasit-se (i18n.ts, i18n.ts).

4. High: Validation strategy is inconsistent and easy to bypass.

- No global validation pipe configured in bootstrap (main.ts).
- Some controllers use ValidationPipe, but users controller defines DTOs and handlers without route-level validation pipe (users.controller.ts, users.controller.ts, users.controller.ts).

5. Medium: Controller-layer complexity is high, increasing regression risk.

- Recipes controller is very large and mixes request handling, query construction, normalization, and aggregation in one class (recipes.controller.ts, recipes.controller.ts, recipes.controller.ts, recipes.controller.ts).

6. Medium: UX/performance opportunities in frontend data flow.

- Homepage is fully client-side with initial loading state and effect fetch instead of server-first rendering ([apps/frontend/src/app/[language]/page.tsx](apps/frontend/src/app/[language]/page.tsx#L1), [apps/frontend/src/app/[language]/page.tsx](apps/frontend/src/app/[language]/page.tsx#L47)).
- Discover page does heavy client-side query/state URL syncing manually, increasing fragility (DiscoverInner.tsx, DiscoverInner.tsx, DiscoverInner.tsx).

7. Medium: Quality gates and automation are not mature yet.

- No API/frontend test files detected.
- No CI workflows detected in .github/workflows.
- Husky pre-commit rewrites full repo with prettier, which can create noisy commits and friction (pre-commit).

8. Low: Existing lint/type issues indicate maintainability debt.

- Hook dependency and any-type issues in key user-facing pages/components (example: [apps/frontend/src/app/[language]/page.tsx](apps/frontend/src/app/[language]/page.tsx#L18), DiscoverInner.tsx, recipes.controller.ts).

**Project Rating**

- Product idea and scope: 8/10
- Tech stack choices: 8/10
- Architecture health right now: 5.5/10
- User experience right now: 6/10
- Engineering maturity (tests/CI/quality gates): 4.5/10
- Overall current state: 6/10

**Suggested Plan**

1. Phase 1 (Week 1-2): Stabilize auth and routing

- Unify auth contracts with strict DTOs for register/login.
- Fix login and signup client flows end-to-end.
- Fix middleware login redirect target and recipe-edit protection matching.
- Ensure me endpoint returns a safe user profile DTO only.
- Done criteria: login/signup/logout/google callback work in both locales; protected pages always gate correctly.

2. Phase 2 (Week 3-4): Harden API boundaries

- Add global ValidationPipe and DTO coverage for all mutable endpoints.
- Move complex logic from recipes controller into focused service/query classes.
- Add central error mapping for consistent frontend messages.
- Done criteria: consistent validation behavior, slimmer controllers, fewer duplicate query blocks.

3. Phase 3 (Week 5-6): UX and performance pass

- Convert high-traffic pages to server-first data loading where possible.
- Standardize data access layer usage pattern (server and client) and remove redundant fetching.
- Improve loading/error/empty states consistency and localization coverage.
- Done criteria: reduced loading flashes, simpler page logic, predictable localized routes.

4. Phase 4 (Week 7-8): Quality and delivery maturity

- Add smoke e2e for auth + discover + recipe detail.
- Add unit tests for critical services and route mapping.
- Add CI for lint + typecheck + tests; tighten pre-commit to changed files only.
- Done criteria: reliable green pipeline, lower regression risk, faster release confidence.

**Open Questions / Assumptions**

- I assumed email/password auth is intended as a first-class path (not only Google OAuth).
- I assumed localized route aliases are intentional for SEO, not temporary migration scaffolding.
- I assumed no hidden private CI pipeline exists outside this workspace.

If you want, I can turn this into a concrete issue backlog with ticket titles, acceptance criteria, and estimated effort per task.

Completed: _Conduct project architecture review_ (1/4)
