import { User as CustomUser } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: CustomUser;
      isAuthenticated(): boolean;
      logout(callback?: (err: any) => void): void;
      session?: any;
    }
  }
}
