import type { Trade } from "../schemas/trade.js";

import { InvalidTradeRowError } from "../domain/errors.js";

const roundAmount = (value: number): number => Number.parseFloat(value.toFixed(8));

export const normalizeMappedSide = (
  value: string,
  mapping: Readonly<Record<string, Trade["side"]>>,
  rowNumber: number,
  fieldName: string,
): Trade["side"] => {
  const normalizedValue = value.trim().toLowerCase();
  const side = mapping[normalizedValue];

  if (!side) {
    throw new InvalidTradeRowError(rowNumber, `Unsupported ${fieldName} value: ${value}`);
  }

  return side;
};

export const computeSignedGrossAmount = (side: Trade["side"], quantity: number, price: number): number => {
  const grossAmount = roundAmount(quantity * price);
  return side === "BUY" ? grossAmount : roundAmount(grossAmount * -1);
};

export const normalizeCurrency = (value: string, rowNumber: number, fieldName: string): string => {
  const normalizedValue = value.trim().toUpperCase();

  if (normalizedValue.length !== 3) {
    throw new InvalidTradeRowError(rowNumber, `${fieldName} must be a 3-letter currency code.`);
  }

  return normalizedValue;
};

export const inferCurrencyFromExchange = (exchange: string, rowNumber: number): string => {
  const normalizedExchange = exchange.trim().toUpperCase();

  if (normalizedExchange === "NSE" || normalizedExchange === "BSE") {
    return "INR";
  }

  throw new InvalidTradeRowError(rowNumber, `Unable to infer currency from exchange: ${exchange}`);
};

export const normalizeIbkrSymbol = (value: string): string => {
  const normalizedValue = value.trim().toUpperCase();

  if (/^[A-Z]{3}\.[A-Z]{3}$/.test(normalizedValue)) {
    const [base = "", quote = ""] = normalizedValue.split(".");
    return `${base}/${quote}`;
  }

  return normalizedValue;
};

export const normalizeHeaders = (headers: string[]): Set<string> =>
  new Set(headers.map((header) => header.trim().toLowerCase()));
