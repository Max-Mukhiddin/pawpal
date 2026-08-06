import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationCreateInput, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { NotificationStatus } from '../../libs/enums/notification.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupAuthor } from '../../libs/config';
import { T } from '../../libs/types/common';
import { TotalCounter } from '../../libs/dto/member/member';

interface NotificationsAggregation {
	list: Notification[];
	metaCounter: TotalCounter[];
}

@Injectable()
export class NotificationService {
	constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

	public async createNotification(input: NotificationCreateInput): Promise<Notification | null> {
		const receiverId = input.receiverId as unknown as Types.ObjectId;
		const authorId = input.authorId as unknown as Types.ObjectId;
		if (receiverId.equals(authorId)) {
			return null;
		}

		try {
			return await this.notificationModel.create(input);
		} catch (err) {
			console.log('Error, NotificationService.createNotification:', err);
			throw err;
		}
	}

	public async getNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const match: T = { receiverId: memberId };
		if (input.status) {
			match.notificationStatus = input.status;
		}

		const sort: T = { createdAt: Direction.DESC };

		const [result, unreadCount] = await Promise.all([
			this.notificationModel
				.aggregate<NotificationsAggregation>([
					{ $match: match },
					{ $sort: sort },
					{
						$facet: {
							list: [
								{ $skip: (input.page - 1) * input.limit },
								{ $limit: input.limit },
								lookupAuthor,
								{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
							],
							metaCounter: [{ $count: 'total' }],
						},
					},
				])
				.exec(),
			this.notificationModel.countDocuments({
				receiverId: memberId,
				notificationStatus: NotificationStatus.WAIT,
			}),
		]);

		const payload: NotificationsAggregation = result[0] ?? { list: [], metaCounter: [] };

		return {
			list: payload.list ?? [],
			metaCounter: payload.metaCounter ?? [],
			unreadCount,
		};
	}

	public async markNotificationRead(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndUpdate(
				{
					_id: notificationId,
					receiverId: memberId,
				},
				{ notificationStatus: NotificationStatus.READ },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result;
	}

	public async markAllRead(memberId: ObjectId): Promise<boolean> {
		await this.notificationModel
			.updateMany(
				{
					receiverId: memberId,
					notificationStatus: NotificationStatus.WAIT,
				},
				{ notificationStatus: NotificationStatus.READ },
			)
			.exec();

		return true;
	}

	public async deleteNotification(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndDelete({
				_id: notificationId,
				receiverId: memberId,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
