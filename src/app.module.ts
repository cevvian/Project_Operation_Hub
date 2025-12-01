import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EmailModule } from './modules/email/email.module';
import { ReposModule } from './modules/repos/repos.module';
import { GithubModule } from './modules/github/github.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskCommentsModule } from './modules/task-comments/task-comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { BranchModule } from './modules/branch/branch.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guard/auth.guard';
import { RolesGuard } from './modules/auth/guard/role.guard';
import { ApplicationInitModule } from './modules/init/application-init.module';
import { TestCaseModule } from './modules/test-case/test-case.module';

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

    UsersModule,
    ProjectsModule,
    EmailModule,
    ReposModule,
    GithubModule,
    SprintsModule,
    TasksModule,
    TaskCommentsModule,
    AttachmentsModule,
    BranchModule,
    AuthModule,
    ApplicationInitModule,
    TestCaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  ],
})
export class AppModule {}
