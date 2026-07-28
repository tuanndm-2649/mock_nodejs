import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/modules/users/entities/user.entity';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { resetDatabase } from './utils/reset-database';
import { TokenPair } from 'src/common/interfaces/token-payload.interface';
import { seedUser } from './utils/seed-user';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleTest: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleTest.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = moduleTest.get(DataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register - create user successful', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test user',
        email: 'test.user@example.com',
        password: 'uerPassword',
      })
      .expect(201);

    const body = res.body as { data: User };

    expect(body.data.fullName).toBe('Test user');
    expect(body.data.passwordHash).toBeUndefined();
  });

  it('POST /auth/register - create user with duplicate email', async () => {
    await seedUser(dataSource, { email: 'test.user@example.com' });

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Duplicate',
        email: 'test.user@example.com',
        password: 'uerPassword1',
      })
      .expect(409);

    const body = res.body as { message: string; success: boolean };

    expect(body.success).toBe(false);
    expect(body.message).toBe('Email already exists');
  });

  it('POST /auth/login - Login successful', async () => {
    await seedUser(dataSource, {
      email: 'test.user@example.com',
      passwordHash: await bcrypt.hash('userPassword', 12),
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test.user@example.com',
        password: 'userPassword',
      })
      .expect(201);

    const data = (res.body as { data: TokenPair }).data;

    expect(data.accessToken).not.toBeUndefined();
    expect(data.refreshToken).not.toBeUndefined();
  });

  it('POST /auth/login - Login failed', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test.user1@example.com',
        password: 'userPassword',
      })
      .expect(401);

    const body = res.body as { message: string };

    expect(body.message).toBe('Invalid email or password');
  });

  it('POST /auth/refresh - refresh token ', async () => {
    await seedUser(dataSource, {
      email: 'test.user@example.com',
      passwordHash: await bcrypt.hash('userPassword', 12),
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test.user@example.com',
        password: 'userPassword',
      })
      .expect(201);

    const refreshToken = (loginRes.body as { data: TokenPair }).data
      .refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(200);

    const newRefreshToken = (refreshRes.body as { data: TokenPair }).data
      .refreshToken;

    expect(newRefreshToken).not.toBeNull();
    expect(newRefreshToken).not.toBe(refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(401);
  });

  it('POST /auth/logout - revokes access token and refresh token', async () => {
    const user = await seedUser(dataSource, {
      email: 'test.user@example.com',
      passwordHash: await bcrypt.hash('userPassword', 12),
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test.user@example.com',
        password: 'userPassword',
      })
      .expect(201);

    const { accessToken, refreshToken } = (loginRes.body as { data: TokenPair })
      .data;

    await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
