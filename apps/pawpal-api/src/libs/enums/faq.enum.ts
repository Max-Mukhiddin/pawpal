import { registerEnumType } from '@nestjs/graphql';

export enum FaqCategory {
	PAYMENT = 'PAYMENT',
	ACCOUNT = 'ACCOUNT',
	TECHNICAL = 'TECHNICAL',
	GENERAL = 'GENERAL',
}
registerEnumType(FaqCategory, {
	name: 'FaqCategory',
});

export enum FaqStatus {
	ACTIVE = 'ACTIVE',
	HOLD = 'HOLD',
	DELETE = 'DELETE',
}
registerEnumType(FaqStatus, {
	name: 'FaqStatus',
});
