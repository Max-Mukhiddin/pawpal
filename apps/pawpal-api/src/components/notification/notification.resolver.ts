import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getNotifications');
		return await this.notificationService.getNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async markNotificationRead(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: markNotificationRead');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.markNotificationRead(memberId, notificationId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async markAllNotificationsRead(@AuthMember('_id') memberId: ObjectId): Promise<boolean> {
		console.log('Mutation: markAllNotificationsRead');
		return await this.notificationService.markAllRead(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async deleteNotification(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: deleteNotification');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.deleteNotification(memberId, notificationId);
	}
}
