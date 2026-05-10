import { InvalidTradeRowError } from "../domain/errors.js";

const buildUtcIsoString = (year: number, month: number, day: number, rowNumber: number, rawValue: string): string => {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidTradeRowError(rowNumber, `Invalid date: ${rawValue}`);
  }

  return date.toISOString();
};

export const parseDdMmYyyyToIso = (value: string, rowNumber: number): string => {
  const match = /^(?<day>\d{2})-(?<month>\d{2})-(?<year>\d{4})$/.exec(value.trim());

  if (!match?.groups) {
    throw new InvalidTradeRowError(rowNumber, `Invalid date: ${value}`);
  }

  const day = Number.parseInt(match.groups.day ?? "", 10);
  const month = Number.parseInt(match.groups.month ?? "", 10);
  const year = Number.parseInt(match.groups.year ?? "", 10);

  return buildUtcIsoString(year, month, day, rowNumber, value);
};

export const parseIsoOrUsDateToIso = (value: string, rowNumber: number): string => {
  const trimmedValue = value.trim();

  const usDateMatch = /^(?<month>\d{2})\/(?<day>\d{2})\/(?<year>\d{4})$/.exec(trimmedValue);
  if (usDateMatch?.groups) {
    const day = Number.parseInt(usDateMatch.groups.day ?? "", 10);
    const month = Number.parseInt(usDateMatch.groups.month ?? "", 10);
    const year = Number.parseInt(usDateMatch.groups.year ?? "", 10);

    return buildUtcIsoString(year, month, day, rowNumber, value);
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new InvalidTradeRowError(rowNumber, `Invalid date: ${value}`);
  }

  return parsedDate.toISOString();
};
