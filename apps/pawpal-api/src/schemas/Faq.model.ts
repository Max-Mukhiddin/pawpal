import { Schema } from 'mongoose';
import { FaqCategory, FaqStatus } from '../libs/enums/faq.enum';

const FaqSchema = new Schema(
	{
		faqCategory: {
			type: String,
			enum: FaqCategory,
			default: FaqCategory.GENERAL,
		},

		faqStatus: {
			type: String,
			enum: FaqStatus,
			default: FaqStatus.ACTIVE,
			index: true,
		},

		faqQuestion: {
			type: String,
			required: true,
		},

		faqAnswer: {
			type: String,
			required: true,
		},

		faqOrder: {
			type: Number,
			default: 0,
		},

		creatorId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
	},
	{ timestamps: true, collection: 'faqs' },
);

FaqSchema.index({ faqStatus: 1, faqOrder: 1 });

export default FaqSchema;
