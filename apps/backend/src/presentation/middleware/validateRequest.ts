import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";

interface ParsableSchema {
  parse: (data: unknown) => any;
}

export const validateBody = (schema: ParsableSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError || (error && typeof error === "object" && "issues" in error)) {
      const issues = (error as any).issues || (error as any).errors || [];
      return res.status(400).json({
        message: "Validation failed",
        errors: issues.map((err: ZodIssue) => ({
          field: Array.isArray(err.path) ? err.path.join(".") : String(err.path || ""),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

export const validateQuery = (schema: ParsableSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query = schema.parse(req.query) as any;
    next();
  } catch (error) {
    if (error instanceof ZodError || (error && typeof error === "object" && "issues" in error)) {
      const issues = (error as any).issues || (error as any).errors || [];
      return res.status(400).json({
        message: "Validation failed",
        errors: issues.map((err: ZodIssue) => ({
          field: Array.isArray(err.path) ? err.path.join(".") : String(err.path || ""),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

export const validateParams = (schema: ParsableSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.params = schema.parse(req.params) as any;
    next();
  } catch (error) {
    if (error instanceof ZodError || (error && typeof error === "object" && "issues" in error)) {
      const issues = (error as any).issues || (error as any).errors || [];
      return res.status(400).json({
        message: "Validation failed",
        errors: issues.map((err: ZodIssue) => ({
          field: Array.isArray(err.path) ? err.path.join(".") : String(err.path || ""),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};
