import { registerEnumType } from '@nestjs/graphql';

export enum ConversationType {
	DIRECT = 'DIRECT',
	ADMIN_SUPPORT = 'ADMIN_SUPPORT',
}
registerEnumType(ConversationType, {
	name: 'ConversationType',
});
