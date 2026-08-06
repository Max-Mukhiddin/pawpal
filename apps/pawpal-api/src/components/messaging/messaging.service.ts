import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Conversation, Conversations } from '../../libs/dto/conversation/conversation';
import { ConversationMessagesInquiry } from '../../libs/dto/conversation/conversation.input';
import { ChatMessage, ChatMessages } from '../../libs/dto/message/message';
import { Member } from '../../libs/dto/member/member';
import { ConversationType } from '../../libs/enums/conversation.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NotificationService } from '../notification/notification.service';
import { shapeIntoMongoObjectId } from '../../libs/config';

const PREVIEW_MAX = 100;

type ConversationRow = Conversation & {
	participants?: Member[];
};

type MemberWithReadMap = Member & {
	conversationLastRead?: Map<string, Date> | Record<string, Date>;
};

@Injectable()
export class MessagingService {
	constructor(
		@InjectModel('Conversation') private readonly conversationModel: Model<Conversation>,
		@InjectModel('Message') private readonly messageModel: Model<ChatMessage>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly notificationService: NotificationService,
	) {}

	public async startOrGetConversation(memberId: ObjectId, targetMemberId: ObjectId): Promise<Conversation> {
		if (this.idEquals(memberId, targetMemberId)) {
			throw new BadRequestException('You cannot start a conversation with yourself');
		}

		const target = await this.memberModel
			.findOne({ _id: targetMemberId, memberStatus: MemberStatus.ACTIVE })
			.select('_id')
			.lean()
			.exec();
		if (!target) throw new BadRequestException(Message.NO_DATA_FOUND);

		const participantIds = this.sortParticipantIds(memberId, targetMemberId);
		const existing = await this.conversationModel
			.findOne({
				type: ConversationType.DIRECT,
				participantIds: { $all: participantIds, $size: 2 },
			})
			.exec();
		if (existing) return existing;

		try {
			return await this.conversationModel.create({
				type: ConversationType.DIRECT,
				participantIds,
				lastMessageAt: null,
				lastMessagePreview: '',
			});
		} catch (err) {
			console.log('Error, MessagingService.startOrGetConversation:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getOrCreateAdminSupportConversation(memberId: ObjectId): Promise<Conversation> {
		const existing = await this.conversationModel
			.findOne({
				type: ConversationType.ADMIN_SUPPORT,
				participantIds: { $all: [memberId], $size: 1 },
			})
			.exec();
		if (existing) return existing;

		try {
			return await this.conversationModel.create({
				type: ConversationType.ADMIN_SUPPORT,
				participantIds: [memberId],
				lastMessageAt: null,
				lastMessagePreview: '',
			});
		} catch (err) {
			console.log('Error, MessagingService.getOrCreateAdminSupportConversation:', err);
			const retry = await this.conversationModel
				.findOne({
					type: ConversationType.ADMIN_SUPPORT,
					participantIds: { $all: [memberId], $size: 1 },
				})
				.exec();
			if (retry) return retry;
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyConversations(memberId: ObjectId): Promise<Conversations> {
		const member = (await this.memberModel
			.findById(memberId)
			.select('conversationLastRead')
			.lean()
			.exec()) as MemberWithReadMap | null;
		const lastReadMap = this.toLastReadMap(member?.conversationLastRead);

		const list = await this.conversationModel
			.aggregate<ConversationRow>([
				{
					$match: {
						$or: [
							{ type: ConversationType.DIRECT, participantIds: memberId },
							{
								type: ConversationType.ADMIN_SUPPORT,
								participantIds: { $all: [memberId], $size: 1 },
							},
						],
					},
				},
				{ $sort: { lastMessageAt: -1, updatedAt: -1 } },
				{
					$lookup: {
						from: 'members',
						localField: 'participantIds',
						foreignField: '_id',
						as: 'participants',
					},
				},
			])
			.exec();

		const enriched: Conversation[] = await Promise.all(
			list.map(async (conversation) => {
				const unreadCount = await this.countUnread(conversation._id, memberId, lastReadMap);
				const otherParticipant =
					conversation.type === ConversationType.DIRECT
						? conversation.participants?.find((p) => !this.idEquals(p._id, memberId))
						: undefined;

				return {
					...conversation,
					otherParticipant,
					unreadCount,
				};
			}),
		);

		return {
			list: enriched,
			metaCounter: [{ total: enriched.length }],
		};
	}

	public async getAdminSupportConversations(): Promise<Conversations> {
		const list = await this.conversationModel
			.aggregate<Conversation>([
				{ $match: { type: ConversationType.ADMIN_SUPPORT } },
				{ $sort: { lastMessageAt: -1, updatedAt: -1 } },
				{
					$lookup: {
						from: 'members',
						localField: 'participantIds',
						foreignField: '_id',
						as: 'participants',
					},
				},
				{
					$addFields: {
						ownerData: { $arrayElemAt: ['$participants', 0] },
					},
				},
				{ $project: { participants: 0 } },
			])
			.exec();

		return {
			list,
			metaCounter: [{ total: list.length }],
		};
	}

	public async getConversationMessages(
		memberId: ObjectId,
		memberType: MemberType,
		conversationId: ObjectId,
		input: ConversationMessagesInquiry,
	): Promise<ChatMessages> {
		const conversation = await this.assertCanAccessConversation(memberId, memberType, conversationId);

		const result = await this.messageModel
			.aggregate<{ list: ChatMessage[]; metaCounter: { total?: number }[] }>([
				{ $match: { conversationId: conversation._id } },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'members',
									localField: 'senderId',
									foreignField: '_id',
									as: 'senderData',
								},
							},
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const payload = result[0] ?? { list: [], metaCounter: [] };

		return {
			list: (payload.list ?? []).map((msg) => this.shapeMessageForClient(msg)),
			metaCounter: payload.metaCounter ?? [],
		};
	}

	public async sendMessage(
		memberId: ObjectId,
		memberType: MemberType,
		conversationId: ObjectId,
		content: string,
	): Promise<ChatMessage> {
		const trimmed = content.trim();
		if (!trimmed) throw new BadRequestException('Message content cannot be empty');

		const conversation = await this.assertCanAccessConversation(memberId, memberType, conversationId);

		const created = await this.messageModel.create({
			conversationId: conversation._id,
			senderId: memberId,
			content: trimmed,
		});

		const preview = trimmed.length > PREVIEW_MAX ? `${trimmed.slice(0, PREVIEW_MAX)}…` : trimmed;
		await this.conversationModel
			.findByIdAndUpdate(conversation._id, {
				lastMessageAt: created.createdAt,
				lastMessagePreview: preview,
			})
			.exec();

		await this.notifyRecipients(conversation, memberId, memberType, trimmed);

		const withSender = await this.messageModel
			.aggregate<ChatMessage>([
				{ $match: { _id: created._id } },
				{
					$lookup: {
						from: 'members',
						localField: 'senderId',
						foreignField: '_id',
						as: 'senderData',
					},
				},
				{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
			])
			.exec();

		return this.shapeMessageForClient(withSender[0] ?? this.toChatMessage(created));
	}

	public async editMessage(memberId: ObjectId, messageId: ObjectId, newContent: string): Promise<ChatMessage> {
		const trimmed = newContent.trim();
		if (!trimmed) throw new BadRequestException('Message content cannot be empty');

		const message = await this.messageModel.findById(messageId).exec();
		if (!message) throw new BadRequestException(Message.NO_DATA_FOUND);
		if (!this.idEquals(message.senderId, memberId)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
		if (message.isDeleted) throw new BadRequestException('Deleted messages cannot be edited');

		message.content = trimmed;
		message.isEdited = true;
		message.editedAt = new Date();
		await message.save();

		const conversation = await this.conversationModel.findById(message.conversationId).exec();
		if (conversation) {
			const latest = await this.messageModel
				.findOne({ conversationId: conversation._id, isDeleted: false })
				.sort({ createdAt: -1 })
				.exec();
			if (latest && this.idEquals(latest._id, message._id)) {
				const preview = trimmed.length > PREVIEW_MAX ? `${trimmed.slice(0, PREVIEW_MAX)}…` : trimmed;
				conversation.lastMessagePreview = preview;
				await conversation.save();
			}
		}

		return this.shapeMessageForClient(this.toChatMessage(message));
	}

	public async deleteMessage(memberId: ObjectId, messageId: ObjectId): Promise<ChatMessage> {
		const message = await this.messageModel.findById(messageId).exec();
		if (!message) throw new BadRequestException(Message.NO_DATA_FOUND);
		if (!this.idEquals(message.senderId, memberId)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		message.isDeleted = true;
		message.deletedAt = new Date();
		await message.save();

		const conversation = await this.conversationModel.findById(message.conversationId).exec();
		if (conversation) {
			const latest = await this.messageModel
				.findOne({ conversationId: conversation._id, isDeleted: false })
				.sort({ createdAt: -1 })
				.exec();
			if (latest) {
				const preview =
					latest.content.length > PREVIEW_MAX ? `${latest.content.slice(0, PREVIEW_MAX)}…` : latest.content;
				conversation.lastMessagePreview = preview;
				conversation.lastMessageAt = latest.createdAt;
				await conversation.save();
			} else if ((conversation.lastMessagePreview || '').length) {
				conversation.lastMessagePreview = 'This message was deleted';
				await conversation.save();
			}
		}

		return this.shapeMessageForClient(this.toChatMessage(message));
	}

	public async markConversationRead(
		memberId: ObjectId,
		memberType: MemberType,
		conversationId: ObjectId,
	): Promise<boolean> {
		await this.assertCanAccessConversation(memberId, memberType, conversationId);

		const key = this.idHex(conversationId);
		const result = await this.memberModel
			.findByIdAndUpdate(memberId, { $set: { [`conversationLastRead.${key}`]: new Date() } }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return true;
	}

	private async assertCanAccessConversation(
		memberId: ObjectId,
		memberType: MemberType,
		conversationId: ObjectId,
	): Promise<Conversation> {
		const conversation = await this.conversationModel.findById(conversationId).exec();
		if (!conversation) throw new BadRequestException(Message.NO_DATA_FOUND);

		const isParticipant = conversation.participantIds.some((id) => this.idEquals(id, memberId));

		if (conversation.type === ConversationType.DIRECT) {
			if (!isParticipant) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
			return conversation;
		}

		if (isParticipant) return conversation;
		if (memberType === MemberType.ADMIN) {
			const admin = await this.memberModel
				.findOne({ _id: memberId, memberType: MemberType.ADMIN, memberStatus: MemberStatus.ACTIVE })
				.select('_id')
				.lean()
				.exec();
			if (admin) return conversation;
		}

		throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private async notifyRecipients(
		conversation: Conversation,
		senderId: ObjectId,
		senderType: MemberType,
		content: string,
	): Promise<void> {
		const preview = content.length > PREVIEW_MAX ? `${content.slice(0, PREVIEW_MAX)}…` : content;
		const sender = await this.memberModel.findById(senderId).select('memberNick').lean().exec();
		const title = `${sender?.memberNick ?? 'Someone'} sent you a message`;

		try {
			if (conversation.type === ConversationType.DIRECT) {
				const other = conversation.participantIds.find((id) => !this.idEquals(id, senderId));
				if (!other) return;
				await this.notificationService.createNotification({
					notificationType: NotificationType.MESSAGE,
					notificationGroup: NotificationGroup.MEMBER,
					notificationTitle: title,
					notificationDesc: preview,
					receiverId: other,
					authorId: senderId,
					notificationRefId: conversation._id,
				});
				return;
			}

			if (senderType === MemberType.ADMIN) {
				const ownerId = conversation.participantIds[0];
				if (!ownerId) return;
				await this.notificationService.createNotification({
					notificationType: NotificationType.MESSAGE,
					notificationGroup: NotificationGroup.MEMBER,
					notificationTitle: title,
					notificationDesc: preview,
					receiverId: ownerId,
					authorId: senderId,
					notificationRefId: conversation._id,
				});
				return;
			}

			const admins = await this.memberModel
				.find({
					memberType: MemberType.ADMIN,
					memberStatus: MemberStatus.ACTIVE,
				})
				.select('_id')
				.lean()
				.exec();

			await Promise.all(
				admins.map((admin) =>
					this.notificationService.createNotification({
						notificationType: NotificationType.MESSAGE,
						notificationGroup: NotificationGroup.MEMBER,
						notificationTitle: title,
						notificationDesc: preview,
						receiverId: admin._id,
						authorId: senderId,
						notificationRefId: conversation._id,
					}),
				),
			);
		} catch (err) {
			console.log('Error, MessagingService.notifyRecipients:', err);
		}
	}

	private async countUnread(
		conversationId: ObjectId,
		memberId: ObjectId,
		lastReadMap: Map<string, Date>,
	): Promise<number> {
		const lastRead = lastReadMap.get(this.idHex(conversationId)) ?? new Date(0);
		return await this.messageModel.countDocuments({
			conversationId,
			senderId: { $ne: memberId },
			isDeleted: false,
			createdAt: { $gt: lastRead },
		});
	}

	private toLastReadMap(raw: Map<string, Date> | Record<string, Date> | undefined): Map<string, Date> {
		const map = new Map<string, Date>();
		if (!raw) return map;
		if (raw instanceof Map) {
			for (const [key, value] of raw.entries()) {
				if (value) map.set(String(key), new Date(value));
			}
			return map;
		}
		for (const [key, value] of Object.entries(raw)) {
			if (value) map.set(key, new Date(value));
		}
		return map;
	}

	private sortParticipantIds(a: ObjectId, b: ObjectId): ObjectId[] {
		const aHex = this.idHex(a);
		const bHex = this.idHex(b);
		return aHex < bHex
			? [shapeIntoMongoObjectId(aHex), shapeIntoMongoObjectId(bHex)]
			: [shapeIntoMongoObjectId(bHex), shapeIntoMongoObjectId(aHex)];
	}

	private idHex(id: ObjectId | Types.ObjectId | string): string {
		if (typeof id === 'string') return id;
		if (id && typeof (id as Types.ObjectId).toHexString === 'function') {
			return (id as Types.ObjectId).toHexString();
		}
		if (id && typeof (id as { toString?: () => string }).toString === 'function') {
			const asString = (id as { toString: () => string }).toString();
			if (asString && asString !== '[object Object]') return asString;
		}
		throw new BadRequestException(Message.BAD_REQUEST);
	}

	private idEquals(a: ObjectId | Types.ObjectId | string, b: ObjectId | Types.ObjectId | string): boolean {
		return this.idHex(a) === this.idHex(b);
	}

	private toChatMessage(doc: ChatMessage | (ChatMessage & { toObject?: () => ChatMessage })): ChatMessage {
		if (doc && typeof (doc as { toObject?: () => ChatMessage }).toObject === 'function') {
			return (doc as { toObject: () => ChatMessage }).toObject();
		}
		return doc;
	}

	private shapeMessageForClient(message: ChatMessage): ChatMessage {
		if (!message) return message;
		if (message.isDeleted) {
			return {
				...message,
				content: '',
			};
		}
		return message;
	}
}
