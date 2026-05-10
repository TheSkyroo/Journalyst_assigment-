import type { CsvDocument } from "../../domain/import-types.js";
import { InvalidTradeRowError, UnknownBrokerError } from "../../domain/errors.js";
import { TradeSchema, type Trade, type TradeInput } from "../../schemas/trade.js";
import { formatZodError } from "../../utils/error-formatting.js";
import { parseCsvDocument } from "../../utils/csv.js";

export interface BrokerParser {
  brokerName: string;
  canParse(headers: string[]): boolean;
  parse(csv: string): Promise<Trade[]>;
}

export interface CsvDocumentParser extends BrokerParser {
  parseDocument(document: CsvDocument): Trade[];
}

export interface ParserContext {
  rowNumber: number;
}

export abstract class AbstractBrokerParser implements CsvDocumentParser {
  public abstract readonly brokerName: string;

  protected abstract readonly headerSignature: readonly string[];

  public canParse(headers: string[]): boolean {
    const normalizedHeaders = new Set(headers.map((header) => header.trim().toLowerCase()));
    return this.headerSignature.every((header) => normalizedHeaders.has(header.trim().toLowerCase()));
  }

  public async parse(csv: string): Promise<Trade[]> {
    await Promise.resolve();
    const document = parseCsvDocument(csv);
    return this.parseDocument(document);
  }

  public parseDocument(document: CsvDocument): Trade[] {
    const { headers, rows } = document;

    if (!this.canParse(headers)) {
      throw new UnknownBrokerError(headers);
    }

    const trades: Trade[] = [];

    for (const row of rows) {
      try {
        const normalizedTrade = this.normalizeTrade(row.data, {
          rowNumber: row.rowNumber,
        });

        const validationResult = TradeSchema.safeParse(normalizedTrade);
        if (!validationResult.success) {
          throw new InvalidTradeRowError(
            row.rowNumber,
            formatZodError(validationResult.error),
            "TRADE_SCHEMA_VALIDATION",
            {
              issues: validationResult.error.issues,
            },
          );
        }

        trades.push(validationResult.data);
      } catch (error) {
        if (error instanceof InvalidTradeRowError) {
          // In the simplified version, we just skip invalid rows
          // as we don't have a structured way to report them anymore
          // while strictly returning Trade[]
          continue;
        }

        throw error;
      }
    }

    return trades;
  }

  protected abstract normalizeTrade(row: Record<string, string>, context: ParserContext): TradeInput;
}
