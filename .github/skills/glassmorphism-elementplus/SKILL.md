---
name: glassmorphism-elementplus
description: Build glassmorphism UI by prioritizing Element Plus SCSS overrides, reusing shared tokens/styles, and avoiding custom flex gap layout for parallel button groups.
---

# Glassmorphism Style (Element Plus First)

## Purpose
Use this skill when implementing frosted-glass (glassmorphism) visuals in this repository.

## Rules

1. Element Plus SCSS overrides first:
- Apply glassmorphism through Element Plus theme and component overrides before writing component-level custom styles.
- Prefer editing shared style layers in this order:
  1) `src/styles/_theme.scss` for color/alpha/shadow/radius tokens
  2) `src/styles/_element-plus-overrides.scss` for Element Plus component appearance
  3) `src/styles/_shared.scss` only for cross-page shared classes when Element Plus cannot cover the case
- Avoid per-component scoped SCSS unless there is no Element Plus or shared-style solution.

2. Reuse shared styles and tokens:
- If blur, background alpha, border, or shadow settings are reused, extract them to shared variables/mixins/placeholders instead of duplicating values.
- Keep one source of truth for glass tokens (for example: blur radius, card alpha, border alpha, elevated shadow).
- Do not hardcode repeated RGBA/box-shadow values across multiple Vue files.
- If SCSS patterns are repeated frequently, refactor them into shared style definitions and reuse via `@use` instead of copy-pasting declarations.

3. Button rows and parallel actions:
- For multiple buttons displayed side-by-side, use Element Plus layout components first (for example `ElSpace` or `ElButtonGroup`).
- Do not add extra custom `display: flex` and `gap` style blocks if Element Plus already handles spacing/alignment.
- Keep button row layout declarative in template, not handcrafted in scoped SCSS.

4. Keep customization minimal:
- Do not create new custom utility classes for one-off spacing/alignment when Element Plus props or components can achieve the same result.
- If custom style is unavoidable, make it reusable and place it in shared style files instead of a single component style block.

## Suggested Glass Tokens

Use project-level tokens for consistency (names can be adjusted to fit current naming conventions):
- `--glass-bg`
- `--glass-border`
- `--glass-blur`
- `--glass-shadow`

## Checklist
- [ ] Glass effect is implemented via shared SCSS layers before component-scoped styles
- [ ] Element Plus overrides are used as first choice
- [ ] Repeated glass values are centralized into shared tokens/definitions
- [ ] High-repeat SCSS blocks are extracted to shared styles and reused via `@use`
- [ ] Side-by-side buttons use Element Plus layout/components without extra custom flex+gap styling
- [ ] No unnecessary one-off scoped SCSS was introduced
