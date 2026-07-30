import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { seedAdmin } from './admin.seed';

const seeds: Record<
  string,
  (dataSource: DataSource, args: Record<string, string>) => Promise<void>
> = {
  admin: seedAdmin,
};

function parseArgs(): { seedName: string; args: Record<string, string> } {
  const [seedName, ...rest] = process.argv.slice(2);
  const args: Record<string, string> = {};

  for (const arg of rest) {
    const [key, value] = arg.replace(/^--/, '').split('=');

    if (key && value) {
      args[key] = value;
    }
  }

  return { seedName, args };
}

async function run(): Promise<void> {
  const { seedName, args } = parseArgs();
  const seed = seeds[seedName];

  if (!seed) {
    console.error(
      `Unknown seed "${seedName}". Available seeds: ${Object.keys(seeds).join(', ')}`,
    );
    process.exit(1);
  }

  await dataSource.initialize();
  await seed(dataSource, args);
  await dataSource.destroy();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
