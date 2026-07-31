import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';

const SALT_ROUNDS = 12;

export async function seedAdmin(
  dataSource: DataSource,
  args: Record<string, string>,
): Promise<void> {
  const name = args.name ?? 'Admin';
  const email = args.email ?? 'admin@example.com';
  const password = args.password ?? 'password123';

  const userRepository = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user = await userRepository.findOne({ where: { email } });

  if (user) {
    user.fullName = name;
    user.passwordHash = passwordHash;
    user.role = 'admin';
  } else {
    user = userRepository.create({
      fullName: name,
      email,
      passwordHash,
      role: 'admin',
    });
  }

  await userRepository.save(user);

  console.log(`Admin user ready: ${email} / ${password}`);
}
