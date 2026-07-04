import type {
  NotFoundError,
  ValidationError,
} from "../../generated/src/generated/models/all/platform-api";

/** Shared error responses (returned, not thrown — http-server-js discriminates
 * them structurally by `statusCode`). */
export const notFound = (message: string): NotFoundError => ({
  statusCode: 404,
  code: "not_found",
  message,
});

export const invalid = (message: string): ValidationError => ({
  statusCode: 422,
  code: "invalid",
  message,
});
