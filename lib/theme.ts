export const THEME_COOKIE_NAME = "pm_theme"
export type Theme = "light" | "dark"

/** Cookie values are untrusted input, so normalize anything unexpected to "light". */
export function resolveTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light"
}
