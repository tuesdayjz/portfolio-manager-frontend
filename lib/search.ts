/**
 * Case-insensitive substring match used to power the client-side search bars
 * across the dashboard, positions, and transaction history pages.
 *
 * @param query - The raw text typed into a search input.
 * @param fields - Any number of record fields to match the query against
 *   (e.g. symbol, name, type). Non-string/number fields are ignored.
 */
export function matchesQuery(
  query: string,
  ...fields: Array<string | number | null | undefined>
) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  return fields.some((field) => {
    if (field === null || field === undefined) return false
    return String(field).toLowerCase().includes(needle)
  })
}
