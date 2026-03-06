import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdateStatus } from '../../libs/dto/booking/booking.update';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { Property } from '../../libs/dto/property/property';
import { PropertyType } from '../../libs/enums/property.enum';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
	) {}

	public async createBooking(memberId: ObjectId, input: BookingInput): Promise<Booking> {
		// if customerId is not provided, treat memberId as customerId
		if (!input.customerId && memberId) {
			input.customerId = memberId;
		}

		// validate propertyType == SERVICE
		const property = await this.propertyModel.findById(input.propertyId).lean().exec();
		if (!property) {
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		}
		if (property.propertyType !== PropertyType.SERVICE) {
			throw new BadRequestException('Only service properties can be booked');
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

	private shapeMatchQuery(match: T, input: BookingsInquiry): void {
		const { propertyId, agentId, customerId, bookingStatus } = input.search;

		if (propertyId) match.propertyId = propertyId;
		if (agentId) match.agentId = agentId;
		if (customerId) match.customerId = customerId;
		if (bookingStatus) match.bookingStatus = bookingStatus;
	}
}

