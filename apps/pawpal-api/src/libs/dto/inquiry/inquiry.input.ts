import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class InquiryInput {
	@IsNotEmpty()
	@Field(() => String)
	listingId: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	agentId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	customerId?: ObjectId;

	@IsNotEmpty()
	@Length(1, 100)
	@Field(() => String)
	name: string;

	@IsNotEmpty()
	@Length(3, 30)
	@Field(() => String)
	phone: string;

	@IsNotEmpty()
	@IsEmail()
	@Field(() => String)
	email: string;

	@IsNotEmpty()
	@Length(1, 500)
	@Field(() => String)
	message: string;

	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;
}

@InputType()
class IISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	listingId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	agentId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	customerId?: ObjectId;

	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;
}

@InputType()
export class InquiriesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => IISearch)
	search: IISearch;
}
