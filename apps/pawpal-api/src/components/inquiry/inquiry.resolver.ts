import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { Inquiry, Inquiries } from '../../libs/dto/inquiry/inquiry';
import { InquiryInput, InquiriesInquiry } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryUpdateStatus } from '../../libs/dto/inquiry/inquiry.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class InquiryResolver {
	constructor(private readonly inquiryService: InquiryService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Inquiry)
	public async createInquiry(
		@Args('input') input: InquiryInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Inquiry> {
		console.log('Mutation: createInquiry');
		input.listingId = shapeIntoMongoObjectId(input.listingId);
		return await this.inquiryService.createInquiry(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Inquiries)
	public async getMyInquiries(
		@Args('input') input: InquiriesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Inquiries> {
		console.log('Query: getMyInquiries');
		if (input.search.listingId) input.search.listingId = shapeIntoMongoObjectId(input.search.listingId);
		if (input.search.customerId) input.search.customerId = shapeIntoMongoObjectId(input.search.customerId);
		if (input.search.agentId) input.search.agentId = shapeIntoMongoObjectId(input.search.agentId);
		return await this.inquiryService.getMyInquiries(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Inquiries)
	public async getAgentInquiries(
		@Args('input') input: InquiriesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Inquiries> {
		console.log('Query: getAgentInquiries');
		if (input.search.listingId) input.search.listingId = shapeIntoMongoObjectId(input.search.listingId);
		if (input.search.customerId) input.search.customerId = shapeIntoMongoObjectId(input.search.customerId);
		if (input.search.agentId) input.search.agentId = shapeIntoMongoObjectId(input.search.agentId);
		return await this.inquiryService.getAgentInquiries(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Inquiry)
	public async updateInquiryStatus(
		@Args('input') input: InquiryUpdateStatus,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Inquiry> {
		console.log('Mutation: updateInquiryStatus');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.inquiryService.updateInquiryStatus(memberId, input);
	}
}
