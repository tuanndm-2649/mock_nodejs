export enum PaymentMethod {
  COD = 'cod',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [],
  [PaymentStatus.FAILED]: [],
};
