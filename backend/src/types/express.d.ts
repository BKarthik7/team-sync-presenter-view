import { AuthenticatedRequest } from './index';

declare global {
  namespace Express {
    interface Request extends AuthenticatedRequest {}
  }
}
