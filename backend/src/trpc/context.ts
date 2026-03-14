import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'accessatlas-dev-secret';

export interface Context {
  userId: string | null;
}

export function createContext({ req }: { req: Request }): Context {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null };
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { userId: payload.userId };
  } catch {
    return { userId: null };
  }
}
