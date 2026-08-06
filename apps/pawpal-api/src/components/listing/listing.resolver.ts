import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ListingService } from './listing.service';
import { Listings, Listing } from '../../libs/dto/listing/listing';
import {
	AgentListingsInquiry,
	AllListingsInquiry,
	OrdinaryInquiry,
	ListingsInquiry,
	ListingInput,
} from '../../libs/dto/listing/listing.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ListingUpdate } from '../../libs/dto/listing/listing.update';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class ListingResolver {
	constructor(private readonly listingService: ListingService) {}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Listing)
	public async createListing(
		@Args('input') input: ListingInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listing> {
		console.log('Mutation: createListing');
		input.memberId = memberId;

		return await this.listingService.createListing(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Listing)
	public async getListing(@Args('listingId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Listing> {
		console.log('Query: getListing');
		const listingId = shapeIntoMongoObjectId(input);
		return await this.listingService.getListing(memberId, listingId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Listing)
	public async updateListing(
		@Args('input') input: ListingUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listing> {
		console.log('Mutation: updateListing');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.listingService.updateListing(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Listings)
	public async getListings(
		@Args('input') input: ListingsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listings> {
		console.log('Query: getListings');
		return await this.listingService.getListings(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Listings)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listings> {
		console.log('Query: getFavorites');
		return await this.listingService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Listings)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listings> {
		console.log('Query: getVisited');
		return await this.listingService.getVisited(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Listings)
	public async getAgentListings(
		@Args('input') input: AgentListingsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listings> {
		console.log('Query: getAgentListings');
		return await this.listingService.getAgentListings(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Listing)
	public async likeTargetListing(
		@Args('listingId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Listing> {
		console.log('Mutation: likeTargetListing');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.listingService.likeTargetListing(memberId, likeRefId);
	}

	// ADMIN ***
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Listings)
	public async getAllListingsByAdmin(@Args('input') input: AllListingsInquiry): Promise<Listings> {
		console.log('Query: getAllListingsByAdmin');
		return await this.listingService.getAllListingsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Listing)
	public async updateListingByAdmin(@Args('input') input: ListingUpdate): Promise<Listing> {
		console.log('Mutation: updateListingByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.listingService.updateListingByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Listing)
	public async removeListingByAdmin(@Args('listingId') input: string): Promise<Listing> {
		console.log('Mutation: removeListingByAdmin');
		const listingId = shapeIntoMongoObjectId(input);
		return await this.listingService.removeListingByAdmin(listingId);
	}
}
