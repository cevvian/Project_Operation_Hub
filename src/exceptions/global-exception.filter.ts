import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from './app.exception';
import { ErrorCode, ErrorMessage, ErrorStatus } from './error-code';
import { ApiResponse } from './api-response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code: number = ErrorCode.UNCATEGORIZED_EXCEPTION;
    let message: string = ErrorMessage[ErrorCode.UNCATEGORIZED_EXCEPTION];
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;

    // Trường hợp 1: AppException custom
    if (exception instanceof AppException) {
      code = exception.code;
      message = ErrorMessage[code];
      status = ErrorStatus[code];
    }
    // Trường hợp 2: HttpException (các lỗi mặc định của NestJS)
    else if (exception instanceof HttpException) {
      const res: any = exception.getResponse();
      status = exception.getStatus();
      message = res?.message || exception.message;
    }
    // Trường hợp 3: Kiểm tra lỗi UUID invalid
    else if (exception instanceof Error && 
             exception.message.includes('invalid input syntax for type uuid')) {
      code = ErrorCode.INVALID_UUID_FORMAT;
      message = ErrorMessage[ErrorCode.INVALID_UUID_FORMAT];
      status = ErrorStatus[ErrorCode.INVALID_UUID_FORMAT];
    }
    // Trường hợp 4: Lỗi runtime khác (TypeError, QueryFailedError,...)
    else {
      message = (exception as any)?.message || message;
    }

    const apiResponse: ApiResponse = {
      code,
      message,
    };

    response.status(status).json(apiResponse);
  }
}