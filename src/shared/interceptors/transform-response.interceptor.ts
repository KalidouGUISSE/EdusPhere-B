import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  metadata?: {
    timestamp: string;
    path: string;
  };
}

interface RequestWithUrl {
  url: string;
  method: string;
}

interface ResponseWithStatus {
  statusCode: number;
}

/**
 * Transform Response Interceptor
 * Wraps all responses in a consistent format
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<RequestWithUrl>();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const response = context
          .switchToHttp()
          .getResponse<ResponseWithStatus>();
        const { statusCode } = response;
        this.logger.log(`${method} ${url} ${statusCode}`);
      }),
      map((data: T): ApiResponse<T> => {
        // If data is already wrapped, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Wrap in standard response format
        return {
          success: true,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            path: url,
          },
        };
      }),
    );
  }
}
