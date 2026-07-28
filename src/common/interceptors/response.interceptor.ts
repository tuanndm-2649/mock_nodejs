import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

interface HttpResponse {
  statusCode: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: unknown;
}

interface PaginatedResult<T> {
  data: T;
  meta: unknown;
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<HttpResponse>();

    return next.handle().pipe(
      map((result) => {
        if (isPaginatedResult(result)) {
          return {
            success: true as const,
            statusCode: response.statusCode,
            data: result.data as T,
            meta: result.meta,
          };
        }

        return {
          success: true as const,
          statusCode: response.statusCode,
          data: result,
        };
      }),
    );
  }
}
