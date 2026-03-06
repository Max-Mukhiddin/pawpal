import { Schema } from 'mongoose';
import { BookingStatus } from '../libs/enums/booking.enum';

const BookingSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Property',
		},

		agentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		customerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		dateTime: {
			type: Date,
			required: true,
		},

		note: {
			type: String,
		},

		bookingStatus: {
			type: String,
			enum: BookingStatus,
			default: BookingStatus.REQUESTED,
		},
	},
	{ timestamps: true, collection: 'bookings' },
);

export default BookingSchema;

