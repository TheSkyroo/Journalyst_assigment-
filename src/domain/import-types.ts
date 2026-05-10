import type { Trade } from "../schemas/trade.js";

export interface CsvRecord {
  rowNumber: number;
  data: Record<string, string>;
}

export interface CsvDocument {
  headers: string[];
  rows: CsvRecord[];
}

