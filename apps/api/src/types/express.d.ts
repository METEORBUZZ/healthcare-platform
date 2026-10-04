import type { Role } from '@healthcare/shared';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: number; role: Role; mustChangePassword?: boolean };
    }
  }
}

export {};
