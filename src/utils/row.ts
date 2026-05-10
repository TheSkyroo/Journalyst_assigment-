import { InvalidTradeRowError } from "../domain/errors.js";

export const requireField = (row: Record<string, string>, fieldName: string, rowNumber: number): string => {
  const value = row[fieldName];
  if (value === undefined || value.trim().length === 0) {
    throw new InvalidTradeRowError(rowNumber, `Missing required field: ${fieldName}`);
  }

  return value.trim();
};

export const parseNumberField = (
  value: string,
  fieldName: string,
  rowNumber: number,
  options: { allowZero?: boolean } = {},
): number => {
  const parsedValue = Number.parseFloat(value.trim());

  if (!Number.isFinite(parsedValue)) {
    throw new InvalidTradeRowError(rowNumber, `Invalid numeric value for ${fieldName}: ${value}`);
  }

  if (parsedValue < 0 || (!options.allowZero && parsedValue === 0)) {
    const expectation = options.allowZero ? "zero or positive" : "positive";
    throw new InvalidTradeRowError(rowNumber, `${fieldName} must be ${expectation}.`);
  }

  return parsedValue;
};
