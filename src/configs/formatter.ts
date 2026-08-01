/**
 * 將數字以簡短方式顯示（最多 1 位小數）
 * 1000 → 1K、1500000 → 1.5M
 */
export const formatShort = (val: number): string => {
  if (val >= 1_000_000) return `${+(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${+(val / 1_000).toFixed(1)}K`
  return `${val}`
}
