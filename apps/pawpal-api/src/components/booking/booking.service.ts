import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdateStatus } from '../../libs/dto/booking/booking.update';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { Listing } from '../../libs/dto/listing/listing';
import { ListingType } from '../../libs/enums/listing.enum';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Listing') private readonly listingModel: Model<Listing>,
	) {}

	public async createBooking(memberId: ObjectId, input: BookingInput): Promise<Booking> {
	const listing = await this.listingModel.findById(input.listingId).lean().exec();

	if (!listing) {
		throw new InternalServerErrorException(Message.NO_DATA_FOUND);
	}

	if (listing.listingType !== ListingType.SERVICE) {
		throw new BadRequestException('Only service listings can be booked');
	}

	input.agentId = listing.memberId;

	if (!input.customerId && memberId) {
		input.customerId = memberId;
	}

	if (!input.bookingStatus) {
		input.bookingStatus = BookingStatus.REQUESTED;
	}

	const bookingDate = new Date(input.dateTime);

	const startOfDay = new Date(bookingDate);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(bookingDate);
	endOfDay.setHours(23, 59, 59, 999);

	const existingBooking = await this.bookingModel.findOne({
		listingId: input.listingId,
		customerId: input.customerId,
		dateTime: {
			$gte: startOfDay,
			$lte: endOfDay,
		},
		bookingStatus: {
			$in: [BookingStatus.REQUESTED, BookingStatus.CONFIRMED],
		},
	}).exec();

	if (existingBooking) {
		throw new BadRequestException('You already booked this service for this day');
	}

	try {
		const result = await this.bookingModel.create(input);
		return result;
	} catch (err) {
		console.log('Error, BookingService.createBooking:', err);
		throw new BadRequestException(Message.CREATE_FAILED);
	}
}

	public async getMyBookings(memberId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
		const match: T = {
			customerId: memberId,
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.bookingModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getAgentBookings(memberId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
		const match: T = {
			agentId: memberId,
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.bookingModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateBookingStatusByAgent(memberId: ObjectId, input: BookingUpdateStatus): Promise<Booking> {
		const search: T = {
			_id: input._id,
			agentId: memberId,
		};

		if (!input.bookingStatus) {
			input.bookingStatus = BookingStatus.CONFIRMED;
		}

		const result = await this.bookingModel
			.findOneAndUpdate(
				search,
				{
					bookingStatus: input.bookingStatus,
				},
				{
					new: true,
				},
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

		public async cancelMyBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
		const search: T = {
			_id: bookingId,
			customerId: memberId,
			bookingStatus: { $in: [BookingStatus.REQUESTED, BookingStatus.CONFIRMED] },
		};

		const result = await this.bookingModel
			.findOneAndUpdate(
				search,
				{
					bookingStatus: BookingStatus.CANCELLED,
				},
				{
					new: true,
				},
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	private shapeMatchQuery(match: T, input: BookingsInquiry): void {
		const { listingId, agentId, customerId, bookingStatus } = input.search;

		if (listingId) match.listingId = listingId;
		if (agentId) match.agentId = agentId;
		if (customerId) match.customerId = customerId;
		if (bookingStatus) match.bookingStatus = bookingStatus;
	}
}