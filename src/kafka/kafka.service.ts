import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  readonly kafka: Kafka;
  private readonly producer: Producer;
  private producerConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'mock-shop',
      brokers: [this.configService.getOrThrow('KAFKA_BROKER')],
    });

    this.producer = this.kafka.producer();
  }

  async publish(
    topic: string,
    message: Record<string, unknown>,
  ): Promise<void> {
    if (!this.producerConnected) {
      await this.producer.connect();
      this.producerConnected = true;
    }

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producerConnected) {
      await this.producer.disconnect();
    }
  }
}
