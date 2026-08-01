---
name: configs-management
description: Use configs/constant for shared dropdown options and configs/formatter for display formatting functions. Apply when creating dropdowns, select options, or number/date formatters in this project.
---

# Configs Management

## Purpose
Centralize shared configuration, dropdown options, and display formatters so they have a single source of truth.

## Folder Structure

```
src/configs/
  constant.ts   ← 下拉選項、共用陣列、靜態設定
  formatter.ts  ← 顯示轉換函式（金額、日期格式化等）
```

## Rules

### constant.ts — 下拉 / 共用陣列

1. All dropdown option arrays must be defined here, not inline in components.
2. Use the `SelectOption<T>` interface for every dropdown source:
   ```ts
   export interface SelectOption<T = string> {
     value: T
     label: string
     icon?: string   // optional
   }
   ```
3. Export two forms when a type's values are also needed for non-UI logic (e.g., chart iteration):
   ```ts
   export const INCOME_TYPE_OPTIONS: SelectOption<IncomeType>[] = [...]  // for el-option
   export const INCOME_TYPES: IncomeType[] = INCOME_TYPE_OPTIONS.map(o => o.value)  // for charts
   ```
4. Name option arrays with `_OPTIONS` suffix and value arrays without suffix.
5. In components, always bind `el-option` with `:value="o.value"` and `:label="o.label"`.

### formatter.ts — 顯示轉換

1. All display formatting functions must be pure functions (no Vue reactivity) defined here.
2. Import directly in components: `import { formatShort } from '../configs/formatter'`
3. The composable `useChartFormat` re-exports from here for backward compatibility — prefer direct import for new code.

## Checklist
- [ ] New dropdown options defined in `configs/constant.ts` using `SelectOption<T>`
- [ ] No inline option arrays in components
- [ ] Formatters added to `configs/formatter.ts`, not inline in components
- [ ] `icon` field omitted when not needed (it is optional)
