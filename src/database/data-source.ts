import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

const config = databaseConfig();

export default new DataSource({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.name,
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
