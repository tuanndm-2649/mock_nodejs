import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { I18nModule } from 'nestjs-i18n';
import configuration from '../config/configuration';
import { envValidationSchema } from '../config/env.validation';
import { typeOrmConfig } from '../config/typeorm.config';
import { ProductsModule } from '../modules/products/products.module';
import { ProductsGrpcController } from './products-grpc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: 'en',
        loaderOptions: { path: join(__dirname, '../i18n/'), watch: true },
      }),
    }),
    ProductsModule,
  ],
  controllers: [ProductsGrpcController],
})
export class ProductsGrpcModule {}
