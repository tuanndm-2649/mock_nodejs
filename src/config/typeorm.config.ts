import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],

  useFactory: (configService: ConfigService) => {
    return {
      type: 'postgres',
      host: configService.getOrThrow<string>('database.host'),
      port: configService.getOrThrow<number>('database.port'),
      username: configService.getOrThrow<string>('database.username'),
      password: configService.getOrThrow<string>('database.password'),
      database: configService.getOrThrow<string>('database.name'),
      autoLoadEntities: true,
      synchronize: false,
      logging: true,
    };
  },
};
