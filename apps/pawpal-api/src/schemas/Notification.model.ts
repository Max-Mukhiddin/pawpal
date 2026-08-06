import { Schema } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		notificationStatus: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.WAIT,
		},

		notificationGroup: {
			type: String,
			enum: NotificationGroup,
			required: true,
		},

		notificationTitle: {
			type: String,
			required: true,
		},

		notificationDesc: {
			type: String,
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
			index: true,
		},

		authorId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},

		notificationRefId: {
			type: Schema.Types.ObjectId,
			required: false,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ receiverId: 1, createdAt: -1 });
NotificationSchema.index({ receiverId: 1, notificationStatus: 1 });

export default NotificationSchema;
