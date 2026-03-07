import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdateStatus } from '../../libs/dto/booking/booking.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class BookingResolver {
	constructor(private readonly bookingService: BookingService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Booking)
	public async createBooking(
		@Args('input') input: BookingInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Booking> {
		console.log('Mutation: createBooking');
		input.propertyId = shapeIntoMongoObjectId(input.propertyId);
		return await this.bookingService.createBooking(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Bookings)
	public async getMyBookings(
		@Args('input') input: BookingsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Bookings> {
		console.log('Query: getMyBookings');
		if (input.search.propertyId) input.search.propertyId = shapeIntoMongoObjectId(input.search.propertyId);
		if (input.search.customerId) input.search.customerId = shapeIntoMongoObjectId(input.search.customerId);
		if (input.search.agentId) input.search.agentId = shapeIntoMongoObjectId(input.search.agentId);
		return await this.bookingService.getMyBookings(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Bookings)
	public async getAgentBookings(
		@Args('input') input: BookingsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Bookings> {
		console.log('Query: getAgentBookings');
		if (input.search.propertyId) input.search.propertyId = shapeIntoMongoObjectId(input.search.propertyId);
		if (input.search.customerId) input.search.customerId = shapeIntoMongoObjectId(input.search.customerId);
		if (input.search.agentId) input.search.agentId = shapeIntoMongoObjectId(input.search.agentId);
		return await this.bookingService.getAgentBookings(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Booking)
	public async updateBookingStatusByAgent(
		@Args('input') input: BookingUpdateStatus,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Booking> {
		console.log('Mutation: updateBookingStatusByAgent');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.bookingService.updateBookingStatusByAgent(memberId, input);
	}
}