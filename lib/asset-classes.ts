import { ASSET_CLASSES, type AssetClass } from "@/lib/mock/positions"
import type { PortfolioAssetType } from "@/lib/portfolio-api"

/** A tab selection: one asset class, or every holding regardless of class. */
export type AssetClassTab = "all" | AssetClass

/**
 * The asset-class tabs shared by the Positions and Analytics pages, so both
 * offer the same choices with the same labels.
 */
export const ASSET_CLASS_TABS: { value: AssetClassTab; label: string }[] = [
  { value: "all", label: "All Holdings" },
  ...ASSET_CLASSES,
]

// The app names its classes after what they hold; the API names them after the
// instrument. The two vocabularies line up one-to-one, but note the API's names
// are singular - `asset_type` is compared against the stored value verbatim
// (see QUOTE_TYPE_TO_ASSET_TYPE in the backend), so a plural here silently
// matches nothing and returns an empty series.
const API_ASSET_TYPE: Record<AssetClass, PortfolioAssetType> = {
  equities: "stock",
  bonds: "bond",
  futures: "future",
  options: "option",
}

/** Translates a tab into the `asset_type` the API filters by. */
export function apiAssetType(tab: AssetClassTab): PortfolioAssetType {
  return tab === "all" ? "all" : API_ASSET_TYPE[tab]
}
