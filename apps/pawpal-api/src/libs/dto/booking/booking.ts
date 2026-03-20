import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Booking {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	listingId: ObjectId;

	@Field(() => String)
	agentId: ObjectId;

	@Field(() => String)
	customerId: ObjectId;

	@Field(() => Date)
	dateTime: Date;

	@Field(() => String, { nullable: true })
	note?: string;

	@Field(() => BookingStatus)
	bookingStatus: BookingStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Bookings {
	@Field(() => [Booking])
	list: Booking[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

