import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PRODUCTS_PACKAGE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'products',
            protoPath: join(__dirname, '../../products-grpc/products.proto'),
            url: configService.getOrThrow<string>('PRODUCTS_GRPC_URL'),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ProductsGrpcClientModule {}
