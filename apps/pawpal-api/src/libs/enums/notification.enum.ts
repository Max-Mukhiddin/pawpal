import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	FOLLOW = 'FOLLOW',
	INQUIRY = 'INQUIRY',
	BOOKING = 'BOOKING',
	SYSTEM = 'SYSTEM',
	MESSAGE = 'MESSAGE',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
	ARCHIVED = 'ARCHIVED',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	LISTING = 'LISTING',
	COMMENT = 'COMMENT',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
