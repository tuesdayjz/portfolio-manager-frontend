/** Per-type badge colour: BUY=green, SELL=red, cash events=neutral. */
export function typeBadgeClass(type: string): string {
  switch (type.toUpperCase()) {
    case "BUY":  return "bg-chart-3/10 text-chart-3"
    case "SELL": return "bg-destructive/10 text-destructive"
    default:     return "bg-muted text-muted-foreground"
  }
}

/** Long=blue, short=red — matches the directional risk each carries. */
export function sideBadgeClass(side: "long" | "short"): string {
  return side === "short"
    ? "bg-destructive/10 text-destructive"
    : "bg-info/10 text-info-foreground"
}

/** Positive delta=green, negative=red — same palette as BUY/SELL. */
export function deltaBadgeClass(value: number): string {
  return value >= 0
    ? "bg-chart-3/10 text-chart-3"
    : "bg-destructive/10 text-destructive"
}
