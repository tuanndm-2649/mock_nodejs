import { User } from 'src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedUser(
  dataSource: DataSource,
  overrides: Partial<User>,
): Promise<User> {
  const repo = dataSource.getRepository(User);

  return repo.save(
    repo.create({
      fullName: 'Test User',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'user',
      ...overrides,
    }),
  );
}
