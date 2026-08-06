import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Faq, Faqs } from '../../libs/dto/faq/faq';
import { FaqInput, FaqsInquiry, FaqUpdate } from '../../libs/dto/faq/faq.input';
import { FaqStatus } from '../../libs/enums/faq.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class FaqService {
	constructor(@InjectModel('Faq') private readonly faqModel: Model<Faq>) {}

	public async createFaq(memberId: ObjectId, input: FaqInput): Promise<Faq> {
		try {
			return await this.faqModel.create({
				...input,
				creatorId: memberId,
				faqStatus: FaqStatus.ACTIVE,
			});
		} catch (err) {
			console.log('Error, FaqService.createFaq:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateFaq(input: FaqUpdate): Promise<Faq> {
		const { _id } = input;
		const result = await this.faqModel
			.findOneAndUpdate({ _id, faqStatus: { $ne: FaqStatus.DELETE } }, input, { new: true })
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async getFaq(faqId: ObjectId): Promise<Faq> {
		const result = await this.faqModel.findOne({ _id: faqId, faqStatus: FaqStatus.ACTIVE }).exec();

		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result;
	}

	public async getFaqs(input: FaqsInquiry): Promise<Faqs> {
		const { faqCategory, text } = input.search ?? {};
		const match: T = { faqStatus: FaqStatus.ACTIVE };

		if (faqCategory) match.faqCategory = faqCategory;
		if (text) {
			match.$or = [
				{ faqQuestion: { $regex: new RegExp(text, 'i') } },
				{ faqAnswer: { $regex: new RegExp(text, 'i') } },
			];
		}

		const result = await this.faqModel
			.aggregate<Faqs>([
				{ $match: match },
				{ $sort: { faqOrder: Direction.ASC, createdAt: Direction.DESC } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) {
			return { list: [], metaCounter: [{ total: 0 }] };
		}

		return result[0];
	}

	public async removeFaqByAdmin(faqId: ObjectId): Promise<Faq> {
		const result = await this.faqModel
			.findOneAndUpdate(
				{ _id: faqId, faqStatus: { $ne: FaqStatus.DELETE } },
				{ faqStatus: FaqStatus.DELETE },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
