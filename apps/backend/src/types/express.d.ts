import { User } from "@mane-bazar/shared";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId?: string;
      user?: User;
    }
  }
}

export {};
