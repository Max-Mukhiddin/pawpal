import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ListingLocation, ListingStatus, ListingType } from '../../enums/listing.enum';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Listing {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ListingType)
	listingType: ListingType;

	@Field(() => ListingStatus)
	listingStatus: ListingStatus;

	@Field(() => ListingLocation)
	listingLocation: ListingLocation;

	@Field(() => String)
	listingAddress: string;

	@Field(() => String)
	listingTitle: string;

	@Field(() => Number)
	listingPrice: number;

	@Field(() => Int)
	listingViews: number;

	@Field(() => Int)
	listingLikes: number;

	@Field(() => Int)
	listingComments: number;

	@Field(() => Int)
	listingRank: number;

	@Field(() => [String])
	listingImages: string[];

	@Field(() => String, { nullable: true })
	listingDesc?: string;

	@Field(() => Int, { nullable: true })
	durationMinutes?: number;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	//** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Listings {
	@Field(() => [Listing])
	list: Listing[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

