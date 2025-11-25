import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      envFilePath: process.env.NODE_ENV === 'production'
        ? join(__dirname, '..', '.env') // production: file .env nằm cùng cấp dist
        : join(__dirname, '..', '.env'), // development: file .env nằm trong backend/
  }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [join(process.cwd(), 'dist/**/*.entity.js')],
        synchronize: false,
      })
//       useFactory: (configService: ConfigService) => {
//   console.log('DB connection config:', {
//     host: configService.get('DB_HOST'),
//     port: configService.get('DB_PORT'),
//     username: configService.get('POSTGRES_USER'),
//     password: configService.get('POSTGRES_PASSWORD'),
//     database: configService.get('POSTGRES_DB'),
//   });
//   return {
//     type: 'postgres',
//     host: configService.get('DB_HOST'),
//     port: +configService.get('DB_PORT'),
//     username: configService.get('POSTGRES_USER'),
//     password: configService.get('POSTGRES_PASSWORD'),
//     database: configService.get('POSTGRES_DB'),
//     entities: [join(process.cwd(), 'dist/**/*.entity.js')],
//     synchronize: true,
//   };
// },

    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
