import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { User } from '../../database/entities/user.entity';
import {
    AuditSeverity,
    AUDIT_SEVERITY,
    LOG_TYPES,
    LogType,
} from './audit-log.constants';

export interface CreateAuditLogDto {
    action: string;
    actionDetail?: string;
    user?: User;
    userId?: string;
    userEmail?: string;
    severity?: AuditSeverity;
    ipAddress?: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    logType?: LogType;
}

export interface FindAuditLogsOptions {
    page?: number;
    limit?: number;
    search?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
}

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
    ) { }

    /**
     * Create an audit log entry (used by both automatic and custom logging)
     */
    async create(dto: CreateAuditLogDto): Promise<AuditLog> {
        // Handle both User entity (id) and JWT payload (sub)
        const userIdFromDto = dto.userId || (dto.user as any)?.sub || dto.user?.id;
        const userEmailFromDto = dto.userEmail || dto.user?.email;

        const auditLog = this.auditLogRepository.create({
            action: dto.action,
            actionDetail: dto.actionDetail,
            userId: userIdFromDto,
            userEmail: userEmailFromDto,
            severity: dto.severity || AUDIT_SEVERITY.INFO,
            ipAddress: dto.ipAddress,
            targetType: dto.targetType,
            targetId: dto.targetId,
            metadata: dto.metadata,
            logType: dto.logType || LOG_TYPES.AUTOMATIC,
        });

        return this.auditLogRepository.save(auditLog);
    }

    /**
     * Log from HTTP request context (for interceptor usage)
     */
    async logFromRequest(
        action: string,
        user: User | null,
        request: any,
        options?: {
            severity?: AuditSeverity;
            targetType?: string;
            targetId?: string;
            metadata?: Record<string, any>;
            actionDetail?: string;
        },
    ): Promise<AuditLog> {
        const ipAddress = this.extractIpAddress(request);

        return this.create({
            action,
            actionDetail: options?.actionDetail,
            user: user || undefined,
            userEmail: user?.email,
            severity: options?.severity || AUDIT_SEVERITY.INFO,
            ipAddress,
            targetType: options?.targetType,
            targetId: options?.targetId,
            metadata: options?.metadata,
            logType: LOG_TYPES.AUTOMATIC,
        });
    }

    /**
     * Custom logging (for use in services directly)
     */
    async logCustom(data: {
        action: string;
        actionDetail?: string;
        severity?: AuditSeverity;
        user?: User;
        userEmail?: string;
        ipAddress?: string;
        targetType?: string;
        targetId?: string;
        metadata?: Record<string, any>;
    }): Promise<AuditLog> {
        return this.create({
            ...data,
            logType: LOG_TYPES.CUSTOM,
        });
    }

    /**
     * Find all audit logs with filtering and pagination
     */
    async findAll(options: FindAuditLogsOptions = {}): Promise<{
        data: AuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = options.page || 1;
        const limit = options.limit || 10;
        const skip = (page - 1) * limit;

        const queryBuilder = this.auditLogRepository
            .createQueryBuilder('audit')
            .leftJoinAndSelect('audit.user', 'user')
            .orderBy('audit.createdAt', 'DESC');

        // Search filter
        if (options.search) {
            queryBuilder.andWhere(
                '(audit.action ILIKE :search OR audit.userEmail ILIKE :search OR audit.actionDetail ILIKE :search)',
                { search: `%${options.search}%` },
            );
        }

        // Severity filter
        if (options.severity && options.severity !== 'ALL') {
            queryBuilder.andWhere('audit.severity = :severity', {
                severity: options.severity,
            });
        }

        // Date range filter
        if (options.startDate) {
            queryBuilder.andWhere('audit.createdAt >= :startDate', {
                startDate: new Date(options.startDate),
            });
        }
        if (options.endDate) {
            queryBuilder.andWhere('audit.createdAt <= :endDate', {
                endDate: new Date(options.endDate),
            });
        }

        // User filter
        if (options.userId) {
            queryBuilder.andWhere('audit.userId = :userId', {
                userId: options.userId,
            });
        }

        // Action filter
        if (options.action) {
            queryBuilder.andWhere('audit.action = :action', {
                action: options.action,
            });
        }

        const [data, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find a single audit log by ID
     */
    async findOne(id: string): Promise<AuditLog | null> {
        return this.auditLogRepository.findOne({
            where: { id },
            relations: ['user'],
        });
    }

    /**
     * Get distinct actions for filtering
     */
    async getDistinctActions(): Promise<string[]> {
        const result = await this.auditLogRepository
            .createQueryBuilder('audit')
            .select('DISTINCT audit.action', 'action')
            .orderBy('audit.action', 'ASC')
            .getRawMany();

        return result.map((r) => r.action);
    }

    /**
     * Extract IP address from request
     */
    private extractIpAddress(request: any): string {
        if (!request) return 'UNKNOWN';

        const forwarded = request.headers?.['x-forwarded-for'];
        if (forwarded) {
            return Array.isArray(forwarded)
                ? forwarded[0]
                : forwarded.split(',')[0].trim();
        }

        return (
            request.ip ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            'UNKNOWN'
        );
    }
}
