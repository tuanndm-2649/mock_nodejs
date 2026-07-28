import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
interface ExceptionResponse {
  message?: string | string[];
}

interface HttpRequest {
  method: string;
  url: string;
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18nService: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<HttpRequest>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    if (statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const responseBody = {
      success: false,
      statusCode,
      message,
    };

    httpAdapter.reply(httpContext.getResponse(), responseBody, statusCode);
  }

  private extractMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return this.i18nService.t('auth.error.serverError');
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const response = exceptionResponse as ExceptionResponse;

      return response.message ?? exception.message;
    }

    return exception.message;
  }
}
