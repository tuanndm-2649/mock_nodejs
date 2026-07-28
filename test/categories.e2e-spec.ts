import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category } from 'src/modules/categories/entities/category.entity';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { resetDatabase } from './utils/reset-database';
import { TokenPair } from 'src/common/interfaces/token-payload.interface';
import { seedUser } from './utils/seed-user';

describe('CategoriesController (e2e)', () => {
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

  async function loginAs(role: 'admin' | 'user'): Promise<string> {
    const email = `${role}@example.com`;

    await seedUser(dataSource, {
      email,
      role,
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    return (res.body as { data: TokenPair }).data.accessToken;
  }

  it('POST /categories - admin can create a category', async () => {
    const adminToken = await loginAs('admin');

    const res = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology', description: 'Tech related posts' })
      .expect(201);

    const body = res.body as { data: Category };

    expect(body.data.name).toBe('Technology');
    expect(body.data.description).toBe('Tech related posts');
  });

  it('POST /categories - regular user is forbidden', async () => {
    const userToken = await loginAs('user');

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Technology' })
      .expect(403);
  });

  it('POST /categories - duplicate name is rejected', async () => {
    const adminToken = await loginAs('admin');

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' })
      .expect(409);

    const body = res.body as { message: string };

    expect(body.message).toBe('Category name already exists');
  });

  it('GET /categories - is public and paginated', async () => {
    const adminToken = await loginAs('admin');

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    const body = res.body as {
      data: Category[];
      meta: { page: number; limit: number; total: number };
    };

    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('GET /categories/:id - admin only', async () => {
    const adminToken = await loginAs('admin');

    const createRes = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' })
      .expect(201);

    const categoryId = (createRes.body as { data: Category }).data.id;

    await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .expect(401);

    const userToken = await loginAs('user');

    await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('PATCH /categories/:id - admin can update', async () => {
    const adminToken = await loginAs('admin');

    const createRes = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' })
      .expect(201);

    const categoryId = (createRes.body as { data: Category }).data.id;

    const updateRes = await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description' })
      .expect(200);

    const body = (updateRes.body as { data: Category }).data;

    expect(body.name).toBe('Technology');
    expect(body.description).toBe('Updated description');
  });

  it('DELETE /categories/:id - admin can delete', async () => {
    const adminToken = await loginAs('admin');

    const createRes = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' })
      .expect(201);

    const categoryId = (createRes.body as { data: Category }).data.id;

    await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
