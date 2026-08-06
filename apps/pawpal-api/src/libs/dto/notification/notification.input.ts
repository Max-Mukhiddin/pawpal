import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => NotificationStatus, { nullable: true })
	status?: NotificationStatus;
}

export class NotificationCreateInput {
	notificationType: NotificationType;
	notificationGroup: NotificationGroup;
	notificationTitle: string;
	notificationDesc?: string;
	receiverId: ObjectId;
	authorId: ObjectId;
	notificationRefId?: ObjectId;
}
