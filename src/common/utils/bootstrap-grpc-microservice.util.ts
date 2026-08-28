import { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

interface BootstrapGrpcMicroserviceOptions {
  package: string;
  protoFile: string;
  urlEnvKey: string;
  defaultUrl: string;
}

export async function bootstrapGrpcMicroservice(
  module: Type<unknown>,
  options: BootstrapGrpcMicroserviceOptions,
): Promise<void> {
  const url = process.env[options.urlEnvKey] ?? options.defaultUrl;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    module,
    {
      transport: Transport.GRPC,
      options: {
        package: options.package,
        protoPath: join(__dirname, '../../', options.protoFile),
        url,
      },
    },
  );

  await app.listen();
  console.log(`[${options.package}] gRPC microservice listening on ${url}`);
}
