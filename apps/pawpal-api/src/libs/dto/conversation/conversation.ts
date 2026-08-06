import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ConversationType } from '../../enums/conversation.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Conversation {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ConversationType)
	type: ConversationType;

	@Field(() => [String])
	participantIds: ObjectId[];

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => String, { nullable: true })
	lastMessagePreview?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	otherParticipant?: Member;

	@Field(() => Member, { nullable: true })
	ownerData?: Member;

	@Field(() => Int, { nullable: true })
	unreadCount?: number;
}

@ObjectType()
export class Conversations {
	@Field(() => [Conversation])
	list: Conversation[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
