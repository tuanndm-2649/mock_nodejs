import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type Redis from 'ioredis';
import type { SignOptions } from 'jsonwebtoken';
import { I18nService } from 'nestjs-i18n';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from 'src/common/interfaces/token-payload.interface';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { UsersService } from '../users/users.service';
import { buildAccessTokenBlacklistKey } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private compareTokenHash(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);

    return timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
  }

  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
    );
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException(this.i18n.t('auth.error.userExists'));
    }

    const user = await this.usersService.create(dto);

    return user;
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.invalidEmailPassword'),
      );
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.invalidEmailPassword'),
      );
    }

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenHash = this.hashToken(tokens.refreshToken);

    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return tokens;
  }

  private async generateTokens(user: {
    id: number;
    email: string;
    role: string;
  }): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      jti: randomUUID(),
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      jti: randomUUID(),
    };

    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),

      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: this.configService.getOrThrow<SignOptions['expiresIn']>(
          'JWT_REFRESH_EXPIRES_IN',
        ),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.refreshTokenInvalid'),
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.refreshTokenInvalid'),
      );
    }

    const user = await this.usersService.findByIdWithRefreshTokenHash(
      payload.sub,
    );

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.refreshTokenInvalid'),
      );
    }

    const refreshTokenMatched = this.compareTokenHash(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatched) {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.refreshTokenInvalid'),
      );
    }

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshTokenHash = this.hashToken(tokens.refreshToken);

    await this.usersService.updateRefreshTokenHash(
      user.id,
      newRefreshTokenHash,
    );

    return tokens;
  }

  async logout(user: AccessTokenPayload): Promise<void> {
    await this.usersService.updateRefreshTokenHash(user.sub, null);

    if (user.exp) {
      const ttlSeconds = user.exp - Math.floor(Date.now() / 1000);

      if (ttlSeconds > 0) {
        await this.redis.set(
          buildAccessTokenBlacklistKey(user.jti),
          '1',
          'EX',
          ttlSeconds,
        );
      }
    }
  }

  getGoogleAuthUrl(): string {
    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'select_account',
    });
  }

  async loginWithGoogle(code: string): Promise<TokenPair> {
    const { tokens } = await this.googleClient.getToken(code);

    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException(
        this.i18n.t('auth.error.googleAuthFailed'),
      );
    }

    const user = await this.usersService.findOrCreateByGoogleProfile({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name ?? payload.email,
    });

    const authTokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenHash = this.hashToken(authTokens.refreshToken);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return authTokens;
  }
}
