import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';
import { Member, TotalCounter } from '../member/member';
import { Listing } from '../listing/listing';

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

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	agentData?: Member;

	@Field(() => Member, { nullable: true })
	customerData?: Member;

	@Field(() => Listing, { nullable: true })
	listingData?: Listing;
}

@ObjectType()
export class Bookings {
	@Field(() => [Booking])
	list: Booking[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
