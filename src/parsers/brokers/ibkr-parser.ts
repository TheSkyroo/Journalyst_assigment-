import { BROKER_HEADER_SIGNATURES, BROKER_NAMES } from "../../constants/brokers.js";
import { type ParserContext, AbstractBrokerParser } from "../base/broker-parser.js";
import { parseIsoOrUsDateToIso } from "../../utils/date.js";
import {
  computeSignedGrossAmount,
  normalizeCurrency,
  normalizeIbkrSymbol,
  normalizeMappedSide,
} from "../../utils/normalization.js";
import { parseNumberField, requireField } from "../../utils/row.js";
import type { TradeInput } from "../../schemas/trade.js";

export class IbkrParser extends AbstractBrokerParser {
  public override readonly brokerName = BROKER_NAMES.IBKR;

  protected override readonly headerSignature = BROKER_HEADER_SIGNATURES[BROKER_NAMES.IBKR];

  protected override normalizeTrade(row: Record<string, string>, context: ParserContext): TradeInput {
    const symbol = normalizeIbkrSymbol(requireField(row, "Symbol", context.rowNumber));
    const side = normalizeMappedSide(
      requireField(row, "Buy/Sell", context.rowNumber),
      { bot: "BUY", sld: "SELL" },
      context.rowNumber,
      "Buy/Sell",
    );
    const quantity = parseNumberField(requireField(row, "Quantity", context.rowNumber), "Quantity", context.rowNumber);
    const price = parseNumberField(requireField(row, "TradePrice", context.rowNumber), "TradePrice", context.rowNumber);
    const currency = normalizeCurrency(requireField(row, "Currency", context.rowNumber), context.rowNumber, "Currency");
    const executedAt = parseIsoOrUsDateToIso(requireField(row, "DateTime", context.rowNumber), context.rowNumber);

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
