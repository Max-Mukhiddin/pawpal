import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
	PAYMENT = 'PAYMENT',
	ACCOUNT = 'ACCOUNT',
	TECHNICAL = 'TECHNICAL',
	EVENT = 'EVENT',
	GENERAL = 'GENERAL',
}
registerEnumType(NoticeCategory, {
	name: 'NoticeCategory',
});

export enum NoticeStatus {
	ACTIVE = 'ACTIVE',
	HOLD = 'HOLD',
	DELETE = 'DELETE',
}
registerEnumType(NoticeStatus, {
	name: 'NoticeStatus',
});
