export const CART_TTL_SECONDS = 60 * 60 * 24 * 30;

export const buildCartKey = (userId: number): string => `cart:${userId}`;
