/** Shared blue treatment for trade and position badges. */
export const tradeBadgeClass = "bg-info/10 text-info-foreground"

/** Long positions get the shared blue trade badge; shorts get the destructive
 * treatment, since they carry margin/borrow risk that longs don't. */
export function sideBadgeClass(side: "long" | "short") {
  return side === "short" ? "bg-destructive/10 text-destructive" : tradeBadgeClass
}

/** Matched transparent delta badge used in both dashboard and detail tables. */
export function deltaBadgeClass(value: number) {
  return value >= 0
    ? "bg-chart-3/10 text-chart-3"
    : "bg-destructive/10 text-destructive"
}
