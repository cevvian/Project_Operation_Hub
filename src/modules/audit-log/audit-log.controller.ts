import {
    Controller,
    Get,
    Query,
    UseGuards,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditLogService, FindAuditLogsOptions } from './audit-log.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/guard/role.guard';
import { Role } from '../../database/entities/enum/role.enum';
import { User } from '../auth/decorator/user.decorator';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(AuthGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get('my-logs')
    @ApiOperation({ summary: 'Get current user\'s audit logs' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'severity', required: false, type: String, enum: ['ALL', 'INFO', 'WARN', 'CRITICAL'] })
    async findMyLogs(
        @User('sub') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('severity') severity?: string,
    ) {
        const options: FindAuditLogsOptions = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            severity,
            userId, // Filter by current user
        };
        return this.auditLogService.findAll(options);
    }

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({
        name: 'severity',
        required: false,
        type: String,
        enum: ['ALL', 'INFO', 'WARN', 'CRITICAL'],
    })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiQuery({ name: 'userId', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, type: String })
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('severity') severity?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
    ) {
        const options: FindAuditLogsOptions = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            severity,
            startDate,
            endDate,
            userId,
            action,
        };

        return this.auditLogService.findAll(options);
    }

    @Get('actions')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get distinct action types for filtering' })
    async getDistinctActions() {
        return this.auditLogService.getDistinctActions();
    }

    @Get(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get a single audit log by ID' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.auditLogService.findOne(id);
    }
}
