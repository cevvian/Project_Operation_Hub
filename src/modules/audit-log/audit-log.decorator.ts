import { SetMetadata } from '@nestjs/common';
import { AuditSeverity, AUDIT_SEVERITY } from './audit-log.constants';

export interface AuditLogOptions {
    action: string;
    severity?: AuditSeverity;
    targetType?: string;
    /**
     * If true, includes request body in metadata (be careful with sensitive data)
     */
    includeBody?: boolean;
    /**
     * Custom function to extract targetId from request params
     * Default: uses 'id' or first param ending with 'Id'
     */
    targetIdParam?: string;
}

export const AUDIT_LOG_KEY = 'audit-log';

/**
 * Decorator to mark controller methods for automatic audit logging
 * 
 * @example
 * // Basic usage
 * @AuditLog({ action: AUDIT_ACTIONS.PROJECT_CREATE, targetType: 'Project' })
 * async create(@Body() dto: CreateProjectDto) { ... }
 * 
 * @example
 * // With severity and custom target ID
 * @AuditLog({ 
 *   action: AUDIT_ACTIONS.PROJECT_DELETE, 
 *   severity: AUDIT_SEVERITY.CRITICAL,
 *   targetType: 'Project',
 *   targetIdParam: 'projectId'
 * })
 * async remove(@Param('projectId') id: string) { ... }
 */
export const AuditLog = (options: AuditLogOptions) =>
    SetMetadata(AUDIT_LOG_KEY, {
        ...options,
        severity: options.severity || AUDIT_SEVERITY.INFO,
    });
