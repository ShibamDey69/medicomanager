export const HTTP_ERROR_CODES = {
  BAD_REQUEST: { code: "BAD_REQUEST", status: 400, message: "Bad Request." },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401, message: "Unauthorized access." },
  FORBIDDEN: { code: "FORBIDDEN", status: 403, message: "Forbidden." },
  NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Resource not found." },
  METHOD_NOT_ALLOWED: { code: "METHOD_NOT_ALLOWED", status: 405, message: "Method not allowed." },
  CONFLICT: { code: "CONFLICT", status: 409, message: "Conflict occurred." },
  UNPROCESSABLE_ENTITY: { code: "UNPROCESSABLE_ENTITY", status: 422, message: "Unprocessable entity." },
  TOO_MANY_REQUESTS: { code: "TOO_MANY_REQUESTS", status: 429, message: "Too many requests." },
  INTERNAL_SERVER_ERROR: { code: "INTERNAL_SERVER_ERROR", status: 500, message: "Internal server error." },
  BAD_GATEWAY: { code: "BAD_GATEWAY", status: 502, message: "Bad gateway." },
  SERVICE_UNAVAILABLE: { code: "SERVICE_UNAVAILABLE", status: 503, message: "Service unavailable." },
  GATEWAY_TIMEOUT: { code: "GATEWAY_TIMEOUT", status: 504, message: "Gateway timeout." },
}
