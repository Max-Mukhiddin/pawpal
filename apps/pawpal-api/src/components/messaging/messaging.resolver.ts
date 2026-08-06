import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { Conversation, Conversations } from '../../libs/dto/conversation/conversation';
import { ConversationMessagesInquiry } from '../../libs/dto/conversation/conversation.input';
import { ChatMessage, ChatMessages } from '../../libs/dto/message/message';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class MessagingResolver {
	constructor(private readonly messagingService: MessagingService) {}

	@UseGuards(AuthGuard)
	@Query(() => Conversations)
	public async getMyConversations(@AuthMember('_id') memberId: ObjectId): Promise<Conversations> {
		console.log('Query: getMyConversations');
		return await this.messagingService.getMyConversations(memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => ChatMessages)
	public async getConversationMessages(
		@Args('conversationId') conversationId: string,
		@Args('input') input: ConversationMessagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<ChatMessages> {
		console.log('Query: getConversationMessages');
		const id = shapeIntoMongoObjectId(conversationId);
		return await this.messagingService.getConversationMessages(memberId, memberType, id, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Conversations)
	public async getAdminSupportConversations(): Promise<Conversations> {
		console.log('Query: getAdminSupportConversations');
		return await this.messagingService.getAdminSupportConversations();
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Conversation)
	public async startOrGetConversation(
		@Args('targetMemberId') targetMemberId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Conversation> {
		console.log('Mutation: startOrGetConversation');
		const targetId = shapeIntoMongoObjectId(targetMemberId);
		return await this.messagingService.startOrGetConversation(memberId, targetId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Conversation)
	public async getOrCreateAdminSupportConversation(@AuthMember('_id') memberId: ObjectId): Promise<Conversation> {
		console.log('Mutation: getOrCreateAdminSupportConversation');
		return await this.messagingService.getOrCreateAdminSupportConversation(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ChatMessage)
	public async sendMessage(
		@Args('conversationId') conversationId: string,
		@Args('content') content: string,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<ChatMessage> {
		console.log('Mutation: sendMessage');
		const id = shapeIntoMongoObjectId(conversationId);
		return await this.messagingService.sendMessage(memberId, memberType, id, content);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ChatMessage)
	public async editMessage(
		@Args('messageId') messageId: string,
		@Args('newContent') newContent: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ChatMessage> {
		console.log('Mutation: editMessage');
		const id = shapeIntoMongoObjectId(messageId);
		return await this.messagingService.editMessage(memberId, id, newContent);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ChatMessage)
	public async deleteMessage(
		@Args('messageId') messageId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ChatMessage> {
		console.log('Mutation: deleteMessage');
		const id = shapeIntoMongoObjectId(messageId);
		return await this.messagingService.deleteMessage(memberId, id);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async markConversationRead(
		@Args('conversationId') conversationId: string,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<boolean> {
		console.log('Mutation: markConversationRead');
		const id = shapeIntoMongoObjectId(conversationId);
		return await this.messagingService.markConversationRead(memberId, memberType, id);
	}
}
