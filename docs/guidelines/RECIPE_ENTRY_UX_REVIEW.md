# Recipe Entry UX Review

Date: 2026-05-29
Scope: Recipe creation flow (mobile + desktop)

## Overall Rating

- Desktop: 7/10
- Mobile: 5.5/10

## Summary

The recipe entry flow is functional and feature-complete (validation, dynamic ingredients, instructions editor, image upload), but mobile usability is significantly weaker than desktop due to layout pressure, long-form fatigue, and high-risk interactions without enough guardrails.

## Findings (Ordered by Severity)

### 1) High: No submission lock/progress state (risk of duplicate recipes)

- Submit action is always enabled and does not expose pending state.
- The create flow performs multiple async requests (create recipe, then image upload), increasing accidental double-submit risk.
- Evidence:
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L140)
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L465)
  - [apps/frontend/src/app/\_pages/recipe/create/create-recipe.form.tsx](../../apps/frontend/src/app/_pages/recipe/create/create-recipe.form.tsx#L31)
  - [apps/frontend/src/app/\_pages/recipe/create/create-recipe.form.tsx](../../apps/frontend/src/app/_pages/recipe/create/create-recipe.form.tsx#L40)

### 2) High: Mobile layout pressure in title/country row

- Title and country are forced into one horizontal row, causing cramped input behavior on small screens.
- Country combobox has fixed width, reducing responsiveness.
- Evidence:
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L152)
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L175)
  - [apps/frontend/src/components/ui/combobox.tsx](../../apps/frontend/src/components/ui/combobox.tsx#L46)
  - [apps/frontend/src/components/ui/combobox.tsx](../../apps/frontend/src/components/ui/combobox.tsx#L59)

### 3) High: Autocomplete overlays can detach from input on mobile keyboard/scroll

- Ingredient/unit suggestions are rendered in a portal with absolute page coordinates.
- Repositioning logic may not fully track viewport shifts (keyboard open, orientation changes, rapid scroll).
- Evidence:
  - [apps/frontend/src/components/ui/ingredient-autocomplete.tsx](../../apps/frontend/src/components/ui/ingredient-autocomplete.tsx#L101)
  - [apps/frontend/src/components/ui/ingredient-autocomplete.tsx](../../apps/frontend/src/components/ui/ingredient-autocomplete.tsx#L130)
  - [apps/frontend/src/components/ui/unit-autocomplete.tsx](../../apps/frontend/src/components/ui/unit-autocomplete.tsx#L136)
  - [apps/frontend/src/components/ui/unit-autocomplete.tsx](../../apps/frontend/src/components/ui/unit-autocomplete.tsx#L170)

### 4) Medium: Destructive ingredient removal has no safeguard

- Ingredient removal is one-tap and immediate, with no confirmation or undo.
- High chance of accidental deletion on touch devices.
- Evidence:
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L335)
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L340)

### 5) Medium: Inconsistent localization in creation experience

- Validation messages and toasts are hardcoded in English.
- Mobile menu labels are hardcoded English strings.
- Evidence:
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L75)
  - [apps/frontend/src/app/\_pages/recipe/create/create-recipe.form.tsx](../../apps/frontend/src/app/_pages/recipe/create/create-recipe.form.tsx#L27)
  - [apps/frontend/src/app/\_pages/recipe/create/create-recipe.form.tsx](../../apps/frontend/src/app/_pages/recipe/create/create-recipe.form.tsx#L44)
  - [apps/frontend/src/components/navigation/mobile-menu.tsx](../../apps/frontend/src/components/navigation/mobile-menu.tsx#L30)

### 6) Medium: Long-form flow lacks mobile scaffolding

- Full form is long, and primary actions are at the bottom only.
- Mobile users get no progress indicator or sticky action area.
- Evidence:
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L148)
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L454)
  - [apps/frontend/src/app/\_pages/recipe/create/page.tsx](../../apps/frontend/src/app/_pages/recipe/create/page.tsx#L22)

### 7) Low: Forced smooth scroll on mount may feel jumpy

- Evidence:
  - [apps/frontend/src/components/recipe/recipe-form.tsx](../../apps/frontend/src/components/recipe/recipe-form.tsx#L122)

## Prioritized Improvements

### Priority 1 (Immediate)

1. Add form submit pending state.

- Disable submit/cancel while saving.
- Show loading label/spinner on submit.
- Add server-side idempotency protection for create endpoint.

2. Fix mobile top-row layout.

- Stack title/country vertically below `md`.
- Make country trigger and dropdown width fluid.

3. Stabilize autocomplete dropdown behavior.

- Use anchored popover/listbox strategy that updates on resize/scroll/keyboard changes.
- Ensure dropdown always stays attached to the active input.

### Priority 2 (Short-term)

1. Add undo/confirm for ingredient removal.
2. Localize all error and status strings through dictionaries.
3. Add sticky mobile action bar or split the form into 2-3 steps.

### Priority 3 (Optional)

1. Consider allowing more than 2 images for desktop while keeping mobile guidance simple.
2. Add optional inline completion progress (e.g., Basics, Ingredients, Steps, Photos).

## Notes

- Runtime check confirmed unauthenticated users are redirected to sign-in before entering create flow:
  - [apps/frontend/src/components/auth/PrivatePage.tsx](../../apps/frontend/src/components/auth/PrivatePage.tsx#L18)
- This review is code-driven with limited runtime verification (unauthenticated route flow confirmed). A full authenticated device pass is recommended before final UX acceptance.
