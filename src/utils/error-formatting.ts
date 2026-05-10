import type { ZodError } from "zod";

import { isAppError } from "../domain/errors.js";
import type { ApiErrorResponse } from "../schemas/api.js";

export const formatZodError = (error: ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

export const toApiErrorResponse = (error: unknown): ApiErrorResponse => {
  if (isAppError(error)) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  };
};
