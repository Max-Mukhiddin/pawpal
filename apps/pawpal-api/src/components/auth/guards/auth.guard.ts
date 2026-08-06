import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';
import { Member } from '../../../libs/dto/member/member';

/** Request shape used by auth guards (GraphQL req or HTTP request). */
export interface AuthRequest {
	headers: { authorization?: string };
	body: {
		authMember?: Member | null;
		[key: string]: unknown;
	};
}

/**
 * Nest ExecutionContext plus the GraphQL-specific `contextType` field
 * that this codebase branches on (do not replace with getType() — keep
 * the existing contextType checks for identical routing behavior).
 */
export type AppExecutionContext = ExecutionContext & {
	contextType?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: AppExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [AuthGuard] ---');

		const request: AuthRequest =
			context.contextType === 'graphql'
				? context.getArgByIndex<{ req: AuthRequest }>(2).req
				: context.switchToHttp().getRequest<AuthRequest>();

		const bearerToken = request.headers.authorization;
		if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);

		const token = bearerToken.split(' ')[1];
		const authMember = await this.authService.verifyToken(token);
		if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

		console.log('memberNick[auth] =>', authMember.memberNick);
		request.body = request.body ?? {};
		request.body.authMember = authMember;

		return true;
	}
}
