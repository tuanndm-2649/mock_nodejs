import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const [host, port, password, db] = [
          configService.getOrThrow<string>('REDIS_HOST'),
          configService.getOrThrow<number>('REDIS_PORT'),
          configService.get<string>('REDIS_PASSWORD'),
          configService.getOrThrow<number>('REDIS_DB'),
        ];

        const client = new Redis({ port, host, db, password });
        const logger = new Logger('RedisModule');

        client.on('error', (error) => logger.error(error));

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }
}
