export type TradeAction = "buy" | "sell"
export type TradePosition = "long" | "short"
export type OptionType = "call" | "put"

export type TradeOrder = {
  id: string
  timestamp: number
  instrument: "equity" | "option"
  symbol: string
  name: string
  action: TradeAction
  position: TradePosition
  quantity: number
  price: number
  total: number
  optionType?: OptionType
  strike?: number
  expiry?: string
}
