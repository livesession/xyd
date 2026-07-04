import type {
  NotFoundError,
  ValidationError,
} from "../../generated/src/generated/models/all/registry-api";

/** Shared error responses (returned; http-server-js discriminates by statusCode). */
export const notFound = (message: string): NotFoundError => ({
  statusCode: 404,
  code: "not_found",
  message,
});

export const invalid = (message: string): ValidationError => ({
  statusCode: 422,
  code: "invalid_spec",
  message,
});
