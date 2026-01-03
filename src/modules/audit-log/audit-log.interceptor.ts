import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from './audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly auditLogService: AuditLogService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            tap(async (responseData) => {
                try {
                    // Get metadata from @AuditLog() decorator
                    const auditMetadata = this.reflector.get<AuditLogOptions>(
                        AUDIT_LOG_KEY,
                        context.getHandler(),
                    );

                    // Only log if decorator is present
                    if (!auditMetadata) {
                        return;
                    }

                    const request = context.switchToHttp().getRequest();
                    const user = request.user;

                    // Extract target ID from params
                    const targetId = this.extractTargetId(
                        request.params,
                        auditMetadata.targetIdParam,
                    );

                    // Build metadata
                    const metadata: Record<string, any> = {};

                    // Include request body if specified (exclude sensitive fields)
                    if (auditMetadata.includeBody && request.body) {
                        metadata.requestBody = this.sanitizeBody(request.body);
                    }

                    // Extract ID from response (handle nested/wrapped responses)
                    const responseId = this.extractResponseId(responseData);
                    const finalTargetId = targetId || responseId;

                    // Include created ID in metadata for create operations
                    if (responseId && !targetId) {
                        metadata.createdId = responseId;
                    }

                    // Log the action
                    await this.auditLogService.logFromRequest(
                        auditMetadata.action,
                        user,
                        request,
                        {
                            severity: auditMetadata.severity,
                            targetType: auditMetadata.targetType,
                            targetId: finalTargetId,
                            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                        },
                    );
                } catch (error) {
                    // Don't let audit logging errors break the main flow
                    console.error('Audit logging error:', error);
                }
            }),
        );
    }

    /**
     * Extract target ID from request params
     */
    private extractTargetId(
        params: Record<string, string>,
        customParam?: string,
    ): string | undefined {
        if (!params) return undefined;

        // Use custom param if specified
        if (customParam && params[customParam]) {
            return params[customParam];
        }

        // Default: look for 'id' first
        if (params.id) {
            return params.id;
        }

        // Then look for any param ending with 'Id'
        const idParam = Object.keys(params).find(
            (key) => key.endsWith('Id') || key === 'id',
        );
        return idParam ? params[idParam] : undefined;
    }

    /**
     * Extract ID from response data (handles nested/wrapped responses)
     */
    private extractResponseId(responseData: any): string | undefined {
        if (!responseData) return undefined;

        // Direct ID
        if (responseData.id) return responseData.id;

        // Nested in result (from success interceptor)
        if (responseData.result?.id) return responseData.result.id;

        // Nested in data
        if (responseData.data?.id) return responseData.data.id;

        return undefined;
    }

    /**
     * Remove sensitive fields from request body
     */
    private sanitizeBody(body: Record<string, any>): Record<string, any> {
        const sensitiveFields = [
            'password',
            'token',
            'secret',
            'apiKey',
            'accessToken',
            'refreshToken',
            'githubToken',
        ];

        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(body)) {
            if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}
