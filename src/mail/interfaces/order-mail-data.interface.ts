export interface OrderMailData {
  email: string;
  orderCode: string;
  recipientName: string;
  totalAmount: number;
  rejectReason?: string;
}
