export const buildAccessTokenBlacklistKey = (jti: string): string =>
  `auth:blacklist:access:${jti}`;
