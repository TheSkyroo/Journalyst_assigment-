import type { Trade } from "../schemas/trade.js";
import { parseCsvDocument } from "../utils/csv.js";
import { createDefaultBrokerRegistry } from "../parsers/registry/default-registry.js";
import type { BrokerRegistry } from "../parsers/registry/broker-registry.js";

export class ImportService {
  public constructor(private readonly brokerRegistry: BrokerRegistry = createDefaultBrokerRegistry()) {}

  public async importTrades(csv: string): Promise<Trade[]> {
    await Promise.resolve();
    const document = parseCsvDocument(csv);
    const parser = this.brokerRegistry.detect(document.headers);
    return parser.parseDocument(document);
  }
}
