import { parentPort, workerData } from 'worker_threads';

interface OrderData {
  status: string;
  totalAmount: number;
}

function generateReport(orders: OrderData[]) {
  const revenueByStatus: Record<string, number> = {};
  const countByStatus: Record<string, number> = {};

  for (const order of orders) {
    revenueByStatus[order.status] =
      (revenueByStatus[order.status] ?? 0) + Number(order.totalAmount);

    countByStatus[order.status] = (countByStatus[order.status] ?? 0) + 1;
  }

  return { revenueByStatus, countByStatus, totalOrder: orders.length };
}

const { orders } = workerData as { orders: OrderData[] };
const result = generateReport(orders);
parentPort!.postMessage(result);
