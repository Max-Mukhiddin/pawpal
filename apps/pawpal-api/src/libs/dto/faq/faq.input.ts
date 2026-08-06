import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { FaqCategory, FaqStatus } from '../../enums/faq.enum';

@InputType()
export class FaqInput {
	@IsNotEmpty()
	@Field(() => FaqCategory)
	faqCategory: FaqCategory;

	@IsNotEmpty()
	@Length(3, 200)
	@Field(() => String)
	faqQuestion: string;

	@IsNotEmpty()
	@Length(3, 5000)
	@Field(() => String)
	faqAnswer: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	faqOrder?: number;
}

@InputType()
export class FaqUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;

	@IsOptional()
	@Field(() => FaqStatus, { nullable: true })
	faqStatus?: FaqStatus;

	@IsOptional()
	@Length(3, 200)
	@Field(() => String, { nullable: true })
	faqQuestion?: string;

	@IsOptional()
	@Length(3, 5000)
	@Field(() => String, { nullable: true })
	faqAnswer?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	faqOrder?: number;
}

@InputType()
export class FSearch {
	@IsOptional()
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class FaqsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => FSearch, { nullable: true })
	search?: FSearch;
}
