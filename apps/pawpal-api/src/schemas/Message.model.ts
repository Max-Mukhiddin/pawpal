import { Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true,
			index: true,
		},

		senderId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},

		content: {
			type: String,
			required: true,
		},

		isEdited: {
			type: Boolean,
			default: false,
		},

		isDeleted: {
			type: Boolean,
			default: false,
		},

		editedAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export default MessageSchema;
