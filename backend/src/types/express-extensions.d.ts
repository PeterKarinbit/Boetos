import { User as CustomUser } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: CustomUser;
    }
  }
}
