/** Shared blue treatment for trade and position badges. */
export const tradeBadgeClass = "bg-info/10 text-info-foreground"

/** Matched transparent delta badge used in both dashboard and detail tables. */
export function deltaBadgeClass(value: number) {
  return value >= 0
    ? "bg-chart-3/10 text-chart-3"
    : "bg-destructive/10 text-destructive"
}
