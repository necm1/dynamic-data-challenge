import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();
    const status = res.statusCode;

    return next.handle().pipe(
      map((response) => {
        if (!response) {
          return response;
        }

        if (response.data && response.meta && response.links) {
          const { data, meta, links } = response;
          return {
            status,
            data,
            meta,
            links,
          };
        }

        return {
          status,
          data: response,
        };
      }),
    );
  }
}
