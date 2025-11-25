
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();
const configService = new ConfigService();
console.log({
  DB_HOST: configService.get('DB_HOST'),
  DB_PORT: configService.get('DB_PORT'),
  DB_USER: configService.get('POSTGRES_USER'),
  DB_PASS: configService.get('POSTGRES_PASSWORD'),
  DB_NAME: configService.get('POSTGRES_DB'),
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<number>('DB_PORT')),  // ép kiểu rõ ràng
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD') || '', // nếu undefined, gán rỗng
  database: configService.get<string>('POSTGRES_DB'),
  synchronize: false,
  logging: true,
  entities: ['src/database/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
