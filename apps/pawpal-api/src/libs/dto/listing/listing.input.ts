import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ListingLocation, ListingStatus, ListingType } from '../../enums/listing.enum';
import { ObjectId } from 'mongoose';
import { availableListingSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ListingInput {
	@IsNotEmpty()
	@Field(() => ListingType)
	listingType: ListingType;

	@IsNotEmpty()
	@Field(() => ListingLocation)
	listingLocation: ListingLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	listingAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	listingTitle: string;

	@IsNotEmpty()
	@Field(() => Number)
	listingPrice: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	durationMinutes?: number;

	@IsNotEmpty()
	@Field(() => [String])
	listingImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	listingDesc?: string;

	memberId?: ObjectId;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class PISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [ListingType], { nullable: true })
	typeList?: ListingType[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ListingsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableListingSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
class APISearch {
	@IsOptional()
	@Field(() => ListingStatus, { nullable: true })
	listingStatus?: ListingStatus;
}

@InputType()
export class AgentListingsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableListingSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search: APISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => ListingStatus, { nullable: true })
	listingStatus?: ListingStatus;

	@IsOptional()
	@Field(() => [ListingLocation], { nullable: true })
	listingLocationList?: ListingLocation[];
}

@InputType()
export class AllListingsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableListingSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}

