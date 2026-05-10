export const BROKER_NAMES = {
  ZERODHA: "zerodha",
  IBKR: "ibkr",
} as const;

export type BrokerName = (typeof BROKER_NAMES)[keyof typeof BROKER_NAMES];

export const BROKER_HEADER_SIGNATURES: Record<BrokerName, readonly string[]> = {
  [BROKER_NAMES.ZERODHA]: ["symbol", "trade_date", "trade_type"],
  [BROKER_NAMES.IBKR]: ["TradeID", "Buy/Sell", "TradePrice"],
};
