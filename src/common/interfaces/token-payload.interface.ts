export interface AccessTokenPayload {
  sub: number;
  email: string;
  role: string;
  type: 'access';
  jti: string;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  type: 'refresh';
  jti: string;
}

export interface TokenUser {
  id: number;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
