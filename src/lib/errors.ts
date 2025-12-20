export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "REFRESH_TOKEN_REVOKED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  statusCode: number;
  code: ErrorCode;

  constructor(code: ErrorCode, message?: string, statusCode?: number) {
    super(message || code);
    this.code = code;
    this.statusCode = statusCode ?? getStatusCode(code);
  }
}

function getStatusCode(code: ErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return 401;

    case "FORBIDDEN":
      return 403;

    case "NOT_FOUND":
      return 404;

    case "VALIDATION_ERROR":
      return 400;

    default:
      return 500;
  }
}

export const Errors = {
  unauthorized: () =>
    new ApiError("UNAUTHORIZED", "Non autorisé"),

  forbidden: () =>
    new ApiError("FORBIDDEN", "Accès interdit"),

  invalidToken: () =>
    new ApiError("INVALID_TOKEN", "Token invalide"),

  tokenExpired: () =>
    new ApiError("TOKEN_EXPIRED", "Token expiré"),

  refreshTokenRevoked: () =>
    new ApiError("REFRESH_TOKEN_REVOKED", "Session invalide", 401),

  validation: (message = "Données invalides") =>
    new ApiError("VALIDATION_ERROR", message),

  notFound: (message = "Ressource introuvable") =>
    new ApiError("NOT_FOUND", message),

  internal: () =>
    new ApiError("INTERNAL_ERROR", "Erreur interne"),
};
