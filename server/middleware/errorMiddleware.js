const errorHandler = (err, req, res, next) => {
  const statusCode =
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : null) ||
    err.statusCode ||
    500;
  const requestId = req.requestId || null;

  if (process.env.NODE_ENV !== "test") {
    console.error(`[${requestId || "no-request-id"}]`, err);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isServerError = statusCode >= 500;
  const safeMessage = isProduction && isServerError
    ? "Something went wrong"
    : err.message || "Something went wrong";

  res.status(statusCode).json({
    requestId,
    message: safeMessage,
    stack: isProduction ? undefined : err.stack
  });
};

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound
};
