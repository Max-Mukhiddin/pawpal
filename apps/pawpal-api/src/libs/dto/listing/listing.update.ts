import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ListingLocation, ListingStatus, ListingType } from '../../enums/listing.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class ListingUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ListingType, { nullable: true })
	listingType?: ListingType;

	@IsOptional()
	@Field(() => ListingStatus, { nullable: true })
	listingStatus?: ListingStatus;

	@IsOptional()
	@Field(() => ListingLocation, { nullable: true })
	listingLocation?: ListingLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	listingAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	listingTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	listingPrice?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	durationMinutes?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	listingImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	listingDesc?: string;

	soldAt?: Date;

	deletedAt?: Date;
}
