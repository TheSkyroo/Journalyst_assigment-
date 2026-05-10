export interface AppErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: AppErrorDetails | undefined;

  public constructor(
    message: string,
    options: {
      code: string;
      statusCode: number;
      details?: AppErrorDetails | undefined;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
  }
}

export class EmptyFileError extends AppError {
  public constructor() {
    super("The uploaded CSV file is empty.", {
      code: "EMPTY_FILE",
      statusCode: 400,
    });
  }
}

export class UnknownBrokerError extends AppError {
  public constructor(headers: string[]) {
    super("Unable to detect broker from CSV headers.", {
      code: "UNKNOWN_BROKER",
      statusCode: 400,
      details: { headers },
    });
  }
}

export class MalformedCsvError extends AppError {
  public constructor(message: string, details?: AppErrorDetails, cause?: unknown) {
    super(message, {
      code: "MALFORMED_CSV",
      statusCode: 400,
      details,
      cause,
    });
  }
}

export class MissingFileUploadError extends AppError {
  public constructor() {
    super("Request must include a CSV file upload in the `file` form field.", {
      code: "MISSING_FILE",
      statusCode: 400,
    });
  }
}

export class InvalidTradeRowError extends AppError {
  public readonly row: number;

  public constructor(row: number, reason: string, code = "INVALID_TRADE_ROW", details?: AppErrorDetails) {
    super(reason, {
      code,
      statusCode: 422,
      details,
    });
    this.row = row;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
