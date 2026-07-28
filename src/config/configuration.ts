import { databaseConfig } from './database.config';

export default () => ({
  app: {
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
  },
  database: databaseConfig(),
});
