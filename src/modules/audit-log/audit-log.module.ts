import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogInterceptor } from './audit-log.interceptor';

@Global() // Make this module globally available so other modules can inject AuditLogService
@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    controllers: [AuditLogController],
    providers: [AuditLogService, AuditLogInterceptor],
    exports: [AuditLogService, AuditLogInterceptor],
})
export class AuditLogModule { }
