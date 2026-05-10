import { BROKER_HEADER_SIGNATURES, BROKER_NAMES } from "../../constants/brokers.js";
import { type ParserContext, AbstractBrokerParser } from "../base/broker-parser.js";
import { parseDdMmYyyyToIso } from "../../utils/date.js";
import { computeSignedGrossAmount, inferCurrencyFromExchange, normalizeMappedSide } from "../../utils/normalization.js";
import { parseNumberField, requireField } from "../../utils/row.js";
import type { TradeInput } from "../../schemas/trade.js";

export class ZerodhaParser extends AbstractBrokerParser {
  public override readonly brokerName = BROKER_NAMES.ZERODHA;

  protected override readonly headerSignature = BROKER_HEADER_SIGNATURES[BROKER_NAMES.ZERODHA];

  protected override normalizeTrade(row: Record<string, string>, context: ParserContext): TradeInput {
    const symbol = requireField(row, "symbol", context.rowNumber).toUpperCase();
    const side = normalizeMappedSide(
      requireField(row, "trade_type", context.rowNumber),
      { buy: "BUY", sell: "SELL" },
      context.rowNumber,
      "trade_type",
    );
    const quantity = parseNumberField(requireField(row, "quantity", context.rowNumber), "quantity", context.rowNumber);
    const price = parseNumberField(requireField(row, "price", context.rowNumber), "price", context.rowNumber);
    const executedAt = parseDdMmYyyyToIso(requireField(row, "trade_date", context.rowNumber), context.rowNumber);
    const currency = inferCurrencyFromExchange(requireField(row, "exchange", context.rowNumber), context.rowNumber);

    return {
      symbol,
      side,
      quantity,
      price,
      totalAmount: computeSignedGrossAmount(side, quantity, price),
      currency,
      executedAt,
      broker: this.brokerName,
      rawData: { ...row },
    };
  }
}
