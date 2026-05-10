import { parse } from "csv-parse/sync";

import type { CsvDocument, CsvRecord } from "../domain/import-types.js";
import { EmptyFileError, MalformedCsvError } from "../domain/errors.js";

const mapRowsToDocument = (rawRows: string[][]): CsvDocument => {
  const [headerRow, ...dataRows] = rawRows;

  if (!headerRow || headerRow.length === 0) {
    throw new EmptyFileError();
  }

  const headers = headerRow.map((value) => value.trim());

  if (headers.some((header) => header.length === 0)) {
    throw new MalformedCsvError("CSV header row contains empty column names.");
  }

  const rows: CsvRecord[] = dataRows.map((rowValues, index) => {
    if (rowValues.length !== headers.length) {
      throw new MalformedCsvError(
        `Row ${index + 1} has ${rowValues.length} columns but expected ${headers.length}.`,
        { row: index + 1 },
      );
    }

    const data = headers.reduce<Record<string, string>>((record, header, headerIndex) => {
      record[header] = rowValues[headerIndex] ?? "";
      return record;
    }, {});

    return {
      rowNumber: index + 1,
      data,
    };
  });

  return { headers, rows };
};

export const parseCsvDocument = (csv: string): CsvDocument => {
  if (csv.trim().length === 0) {
    throw new EmptyFileError();
  }

  try {
    const rawRows = parse(csv, {
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: false,
    });

    if (rawRows.length === 0) {
      throw new EmptyFileError();
    }

    return mapRowsToDocument(rawRows);
  } catch (error) {
    if (error instanceof EmptyFileError || error instanceof MalformedCsvError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unable to parse CSV content.";
    throw new MalformedCsvError(`Malformed CSV input. ${message}`, undefined, error);
  }
};
