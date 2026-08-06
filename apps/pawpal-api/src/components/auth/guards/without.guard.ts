import { CanActivate, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AppExecutionContext, AuthRequest } from './auth.guard';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: AppExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		if (context.contextType === 'graphql') {
			const request = context.getArgByIndex<{ req: AuthRequest }>(2).req,
				bearerToken = request.headers.authorization;

			if (bearerToken) {
				try {
					const token = bearerToken.split(' ')[1],
						authMember = await this.authService.verifyToken(token);
					request.body.authMember = authMember;
				} catch {
					request.body.authMember = null;
				}
			} else request.body.authMember = null;

			console.log('memberNick[without] =>', request.body.authMember?.memberNick ?? 'none');
			return true;
		}
		return true;

		// description => http, rpc, gprs and etc are ignored
	}
}
