---
name: vue-elementplus-dayjs-es6
description: Prefer Element Plus components over custom scoped SCSS, use dayjs for all date handling, write ES6-style functions, and enforce Vue SFC section order.
---

# Vue Element Plus Dayjs ES6 Style

## Purpose
Use this skill when creating or modifying Vue components in this repository.

## Rules

1. UI components first:
- Prefer Element Plus built-in components and props before writing custom UI structure.
- Use Element Plus layout and spacing components where possible, such as ElSpace, ElRow, ElCol, ElCard, ElDivider, ElTag.
- Avoid custom scoped styles unless required for a missing capability.

2. Minimal styling policy:
- Do not add style blocks by default.
- If style is unavoidable, keep it minimal and only for gaps not covered by Element Plus.
- Prefer inline style props or Element Plus configuration over new scoped SCSS.

3. Date handling policy:
- All date parsing, formatting, and date display must use dayjs.
- Avoid manual string slicing for date format conversion.
- Keep output format explicit, for example dayjs(value).format('YYYY-MM-DD') or dayjs(value).format('MM-DD').

4. JavaScript/TypeScript style:
- Use ES6+ syntax.
- Prefer const and let over var.
- Prefer arrow functions for local functions and callbacks.
- Keep functions small and single-purpose.

5. Vue SFC section order:
- Always order sections as:
  1) template
  2) script setup lang="ts"
  3) style scoped lang="scss"
- If no style is needed, omit the style section.

6. Component-based development:
- Follow componentized architecture.
- Split large pages into focused, reusable components.
- Keep each component responsible for a single UI concern.

7. Shared logic with composables:
- Move reusable stateful logic and shared methods into composables.
- Avoid duplicating logic across components when a composable can be reused.
- Prefer composables for cross-component logic such as formatting, filtering, and interaction state.

## Checklist
Before finishing a Vue change, verify:
- Element Plus components were used first.
- No unnecessary scoped SCSS was introduced.
- Date conversion uses dayjs only.
- Functions follow ES6 arrow style where appropriate.
- Vue file section order is correct.
- Components are modular and single-responsibility.
- Reusable logic is extracted into composables when applicable.
