import { Schema } from 'mongoose';
import { ConversationType } from '../libs/enums/conversation.enum';

const ConversationSchema = new Schema(
	{
		type: {
			type: String,
			enum: ConversationType,
			required: true,
			index: true,
		},

		participantIds: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
			required: true,
			validate: {
				validator: (ids: unknown[]) => Array.isArray(ids) && ids.length >= 1 && ids.length <= 2,
				message: 'participantIds must contain 1 or 2 member IDs',
			},
		},

		lastMessageAt: {
			type: Date,
			default: null,
		},

		lastMessagePreview: {
			type: String,
			default: '',
		},
	},
	{ timestamps: true, collection: 'conversations' },
);

ConversationSchema.index({ participantIds: 1, type: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index(
	{ type: 1, participantIds: 1 },
	{
		unique: true,
		partialFilterExpression: { type: ConversationType.ADMIN_SUPPORT },
	},
);

export default ConversationSchema;
