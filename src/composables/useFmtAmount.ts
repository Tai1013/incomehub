export const fmtAmount = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1)}K`
  return `$${val}`
}
