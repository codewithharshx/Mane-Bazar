import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const REQUEST_ID_HEADER = "x-request-id";

export const attachRequestContext = (req: Request, res: Response, next: NextFunction): void => {
  const incomingRequestId = req.get(REQUEST_ID_HEADER);
  const requestId = incomingRequestId || randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};
