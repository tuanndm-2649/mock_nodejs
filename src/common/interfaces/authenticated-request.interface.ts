import { AccessTokenPayload } from './token-payload.interface';

export interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };

  user?: AccessTokenPayload;

  method: string;
  url: string;
}
