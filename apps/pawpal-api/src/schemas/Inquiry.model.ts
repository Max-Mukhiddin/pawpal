import { Schema } from 'mongoose';
import { InquiryStatus } from '../libs/enums/inquiry.enum';

const InquirySchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Property',
		},

		agentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		name: {
			type: String,
			required: true,
		},

		phone: {
			type: String,
			required: true,
		},

		email: {
			type: String,
			required: true,
		},

		message: {
			type: String,
			required: true,
		},

		inquiryStatus: {
			type: String,
			enum: InquiryStatus,
			default: InquiryStatus.NEW,
		},
	},
	{ timestamps: true, collection: 'inquiries' },
);

export default InquirySchema;

