import { DataSource } from 'typeorm';
import { UsersSeeder } from './src/users/users.seeder';
import { User } from './src/users/entities/user.entity';
import 'dotenv/config';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
});

async function runSeeder() {
  await dataSource.initialize();
  const seeder = new UsersSeeder(dataSource);
  await seeder.run();
  await dataSource.destroy();
}

runSeeder();