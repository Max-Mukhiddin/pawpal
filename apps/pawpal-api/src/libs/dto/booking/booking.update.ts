import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { BookingStatus } from '../../enums/booking.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class BookingUpdateStatus {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;
}
