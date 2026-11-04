import { Request, Response, NextFunction } from "express";
import pino from "pino";

const logger = pino({
  transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
});

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const statusCode =
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : null) ||
    err.statusCode ||
    500;
  const requestId = req.requestId || null;

  if (process.env.NODE_ENV !== "test") {
    logger.error({
      requestId,
      method: req.method,
      url: req.originalUrl,
      err: {
        message: err.message,
        stack: err.stack,
        ...err,
      },
    }, "Express request error occurred");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isServerError = statusCode >= 500;
  const safeMessage =
    isProduction && isServerError
      ? "Something went wrong"
      : err.message || "Something went wrong";

  res.status(statusCode).json({
    requestId,
    message: safeMessage,
    stack: isProduction ? undefined : err.stack,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};
