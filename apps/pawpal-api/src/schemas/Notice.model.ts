import { Schema } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../libs/enums/notice.enum';

const NoticeSchema = new Schema(
	{
		noticeCategory: {
			type: String,
			enum: NoticeCategory,
			default: NoticeCategory.GENERAL,
		},

		noticeStatus: {
			type: String,
			enum: NoticeStatus,
			default: NoticeStatus.ACTIVE,
			index: true,
		},

		noticeTitle: {
			type: String,
			required: true,
		},

		noticeContent: {
			type: String,
			required: true,
		},

		noticeViews: {
			type: Number,
			default: 0,
		},

		creatorId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
	},
	{ timestamps: true, collection: 'notices' },
);

NoticeSchema.index({ noticeStatus: 1, createdAt: -1 });
NoticeSchema.index({ noticeCategory: 1, noticeStatus: 1 });

export default NoticeSchema;
