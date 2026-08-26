import { Kafka } from 'kafkajs';
import 'dotenv/config';

interface OrderPlacedEvent {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  email: string;
}

const serviceName = process.argv[2];

if (!serviceName) {
  console.error('Usage: ts-node order-placed.consumer.ts <service-name>');
  process.exit(1);
}

async function run(): Promise<void> {
  const kafka = new Kafka({
    clientId: serviceName,
    brokers: [process.env.KAFKA_BROKER!],
  });

  const consumer = kafka.consumer({ groupId: serviceName });
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.placed', fromBeginning: true });

  await consumer.run({
    eachMessage: ({ message }) => {
      const data = JSON.parse(message.value!.toString()) as OrderPlacedEvent;
      console.log(`[${serviceName}] recieved order.placed: `, data);
      return Promise.resolve();
    },
  });
}

void run();
