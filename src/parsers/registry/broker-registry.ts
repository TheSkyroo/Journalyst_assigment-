import { UnknownBrokerError } from "../../domain/errors.js";
import type { CsvDocumentParser } from "../base/broker-parser.js";

export class BrokerRegistry {
  public constructor(private readonly parsers: readonly CsvDocumentParser[]) {}

  public detect(headers: string[]): CsvDocumentParser {
    const parser = this.parsers.find((candidate) => candidate.canParse(headers));

    if (!parser) {
      throw new UnknownBrokerError(headers);
    }

    return parser;
  }

  public list(): readonly CsvDocumentParser[] {
    return this.parsers;
  }
}
