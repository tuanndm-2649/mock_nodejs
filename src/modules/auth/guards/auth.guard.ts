import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type Redis from 'ioredis';
import { I18nService } from 'nestjs-i18n';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { AccessTokenPayload } from 'src/common/interfaces/token-payload.interface';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { buildAccessTokenBlacklistKey } from '../auth.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly i18nService: I18nService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        this.i18nService.t('auth.error.unauthorized'),
      );
    }

    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException(
        this.i18nService.t('auth.error.unauthorized'),
      );
    }

    const isRevoked = await this.redis.exists(
      buildAccessTokenBlacklistKey(payload.jti),
    );

    if (isRevoked) {
      throw new UnauthorizedException(
        this.i18nService.t('auth.error.unauthorized'),
      );
    }

    request.user = payload;

    return true;
  }

  private extractTokenFromHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
