import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationInitService } from './application-init.service';
import { UsersModule } from '../users/users.module';
import { User } from 'src/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // ← Đăng ký entity ở đây
  ],
  providers: [ApplicationInitService],
  exports: [ApplicationInitService], // nếu cần dùng ở nơi khác
})
export class ApplicationInitModule {}