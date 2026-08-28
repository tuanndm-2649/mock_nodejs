import { bootstrapGrpcMicroservice } from './common/utils/bootstrap-grpc-microservice.util';
import { ProductsGrpcModule } from './products-grpc/products-grpc.module';

void bootstrapGrpcMicroservice(ProductsGrpcModule, {
  package: 'products',
  protoFile: 'products-grpc/products.proto',
  urlEnvKey: 'PRODUCTS_GRPC_URL',
  defaultUrl: 'localhost:50051',
});
