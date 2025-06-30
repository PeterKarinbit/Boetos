import { User as CustomUser } from '../entity/User';

declare global {
  namespace Express {
    export interface Request {
      user?: CustomUser;
    }
  }
}
