import 'dotenv/config';
import { Kafka } from 'kafkajs';
import * as nodemailer from 'nodemailer';

const LOW_STOCK_THRESHOLD = 5;

interface OrderItemEvent {
  productId: number;
  productName: string;
  remainingStock: number;
}

interface OrderPlacedEvent {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  email: string;
  items: OrderItemEvent[];
}

async function sendLowStockAlert(items: OrderItemEvent[]): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const lines = items
    .map((item) => `- ${item.productName}: ${item.remainingStock} left`)
    .join('\n');

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_FROM,
    subject: `[Alert] ${items.length} product(s) running low on stock`,
    text: `The following products are running low on stock:\n${lines}`,
  });
}

async function run(): Promise<void> {
  const kafka = new Kafka({
    clientId: 'low-stock-alert',
    brokers: [process.env.KAFKA_BROKER!],
  });

  const consumer = kafka.consumer({ groupId: 'low-stock-alert' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.placed', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value!.toString()) as OrderPlacedEvent;

      const lowStockItems = data.items.filter(
        (item) => item.remainingStock < LOW_STOCK_THRESHOLD,
      );

      if (lowStockItems.length > 0) {
        console.log(
          `[low-stock-alert] Order ${data.orderCode} has ${lowStockItems.length} low-stock item(s), sending alert...`,
        );
        await sendLowStockAlert(lowStockItems);
      }
    },
  });
}

void run();
