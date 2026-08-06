import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class ChatMessage {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	conversationId: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String)
	content: string;

	@Field(() => Boolean)
	isEdited: boolean;

	@Field(() => Boolean)
	isDeleted: boolean;

	@Field(() => Date, { nullable: true })
	editedAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	senderData?: Member;
}

@ObjectType()
export class ChatMessages {
	@Field(() => [ChatMessage])
	list: ChatMessage[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
