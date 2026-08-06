import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface GqlRequestContext {
	req: { body: unknown };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger();

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'http') {
			// HTTP requests fall through to the shared passthrough handler below.
		} else if (requestType === 'graphql') {
			/* (1) Print Request */
			const gqlContext = GqlExecutionContext.create(context);
			const reqBody = gqlContext.getContext<GqlRequestContext>().req.body;
			this.logger.log(`${this.stringify(reqBody)}`, 'REQUEST');

			/* (2) Errors handing via GraphQL */
			/* (3) No Errors, giving Response below */
			return next.handle().pipe(
				tap((response) => {
					const responseTime = Date.now() - recordTime;
					this.logger.log(`${this.stringify(response)} - ${responseTime}ms \n\n`, 'RESPONSE');
				}),
			);
		}
		return next.handle().pipe();
	}

	private stringify(value: unknown): string {
		return JSON.stringify(value).slice(0, 75);
	}
}
