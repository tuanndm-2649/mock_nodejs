import { randomInt } from 'crypto';

const ORDER_CODE_PREFIX = 'ORD';
const ORDER_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ORDER_CODE_RANDOM_LENGTH = 7;

export function generateOrderCode(): string {
  let random = '';

  for (let i = 0; i < ORDER_CODE_RANDOM_LENGTH; i++) {
    random += ORDER_CODE_CHARSET[randomInt(ORDER_CODE_CHARSET.length)];
  }

  return `${ORDER_CODE_PREFIX}${random}`;
}
