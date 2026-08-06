import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { InquiryStatus } from '../../enums/inquiry.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class InquiryUpdateStatus {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;
}
