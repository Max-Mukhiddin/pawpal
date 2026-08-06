import { createParamDecorator } from '@nestjs/common';
import { Member } from '../../../libs/dto/member/member';
import { AppExecutionContext, AuthRequest } from '../guards/auth.guard';

export const AuthMember = createParamDecorator((data: string | undefined, context: AppExecutionContext) => {
	let request: AuthRequest;
	if (context.contextType === 'graphql') {
		request = context.getArgByIndex<{ req: AuthRequest }>(2).req;
		if (request.body.authMember) {
			(request.body.authMember as Member & { authorization?: string }).authorization = request.headers?.authorization;
		}
	} else request = context.switchToHttp().getRequest<AuthRequest>();

	const member = request.body.authMember;

	if (member) return data ? member[data as keyof Member] : member;
	else return null;
});
