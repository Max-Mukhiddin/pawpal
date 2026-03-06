import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';
import { Member, TotalCounter } from '../member/member';
import { Property } from '../property/property';

@ObjectType()
export class Inquiry {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	propertyId: ObjectId;

	@Field(() => String)
	agentId: ObjectId;

	@Field(() => String, { nullable: true })
	customerId?: ObjectId;

	@Field(() => String)
	name: string;

	@Field(() => String)
	phone: string;

	@Field(() => String)
	email: string;

	@Field(() => String)
	message: string;

	@Field(() => InquiryStatus)
	inquiryStatus: InquiryStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	agentData?: Member;

	@Field(() => Member, { nullable: true })
	customerData?: Member;

	@Field(() => Property, { nullable: true })
	propertyData?: Property;
}

@ObjectType()
export class Inquiries {
	@Field(() => [Inquiry])
	list: Inquiry[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

