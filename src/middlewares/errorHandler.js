export class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Route not found"
    }
  });
}

export function errorHandler(err, req, res, next) {
  req.log?.error({ err }, "request failed");

  const status = err.status ?? 500;
  const message = status >= 500 ? "Internal server error" : err.message;

  res.status(status).json({
    success: false,
    error: {
      code: err.code ?? "INTERNAL_ERROR",
      message
    }
  });
}
