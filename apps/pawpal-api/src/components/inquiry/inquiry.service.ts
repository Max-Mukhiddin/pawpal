import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Inquiry, Inquiries } from '../../libs/dto/inquiry/inquiry';
import { InquiryInput, InquiriesInquiry } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryUpdateStatus } from '../../libs/dto/inquiry/inquiry.update';
import { InquiryStatus } from '../../libs/enums/inquiry.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember, lookupProperty } from '../../libs/config';

@Injectable()
export class InquiryService {
	constructor(@InjectModel('Inquiry') private readonly inquiryModel: Model<Inquiry>) {}

	public async createInquiry(memberId: ObjectId, input: InquiryInput): Promise<Inquiry> {
		// if customerId is not provided, treat memberId as customerId
		if (!input.customerId && memberId) {
			input.customerId = memberId;
		}

		try {
			const result = await this.inquiryModel.create(input);
			return result;
		} catch (err) {
			console.log('Error, InquiryService.createInquiry:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyInquiries(memberId: ObjectId, input: InquiriesInquiry): Promise<Inquiries> {
		const match: T = {
			customerId: memberId,
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.inquiryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember('agentId', 'agentData'),
							lookupMember('customerId', 'customerData'),
							lookupProperty('propertyId', 'propertyData'),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getAgentInquiries(memberId: ObjectId, input: InquiriesInquiry): Promise<Inquiries> {
		const match: T = {
			agentId: memberId,
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.inquiryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember('agentId', 'agentData'),
							lookupMember('customerId', 'customerData'),
							lookupProperty('propertyId', 'propertyData'),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateInquiryStatus(memberId: ObjectId, input: InquiryUpdateStatus): Promise<Inquiry> {
		const search: T = {
			_id: input._id,
			agentId: memberId,
		};

		if (!input.inquiryStatus) {
			input.inquiryStatus = InquiryStatus.RESPONDED;
		}

		const result = await this.inquiryModel
			.findOneAndUpdate(
				search,
				{
					inquiryStatus: input.inquiryStatus,
				},
				{
					new: true,
				},
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	private shapeMatchQuery(match: T, input: InquiriesInquiry): void {
		const { propertyId, customerId, inquiryStatus } = input.search;

		if (propertyId) match.propertyId = propertyId;
		if (customerId) match.customerId = customerId;
		if (inquiryStatus) match.inquiryStatus = inquiryStatus;
	}
}

