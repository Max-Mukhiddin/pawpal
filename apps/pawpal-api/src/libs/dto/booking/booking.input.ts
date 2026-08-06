import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class BookingInput {
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
	@IsDate()
	@Field(() => Date)
	dateTime: Date;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	note?: string;

	@IsOptional()
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;
}

@InputType()
class BISearch {
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
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;
}

@InputType()
export class BookingsInquiry {
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
	@Field(() => BISearch)
	search: BISearch;
}
