import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticesInquiry, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		try {
			return await this.noticeModel.create({
				...input,
				creatorId: memberId,
				noticeStatus: NoticeStatus.ACTIVE,
			});
		} catch (err) {
			console.log('Error, NoticeService.createNotice:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateNotice(input: NoticeUpdate): Promise<Notice> {
		const { _id } = input;
		const result = await this.noticeModel
			.findOneAndUpdate({ _id, noticeStatus: { $ne: NoticeStatus.DELETE } }, input, { new: true })
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async getNotice(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndUpdate(
				{ _id: noticeId, noticeStatus: NoticeStatus.ACTIVE },
				{ $inc: { noticeViews: 1 } },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result;
	}

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory, text } = input.search ?? {};
		const match: T = { noticeStatus: NoticeStatus.ACTIVE };

		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (text) {
			match.$or = [
				{ noticeTitle: { $regex: new RegExp(text, 'i') } },
				{ noticeContent: { $regex: new RegExp(text, 'i') } },
			];
		}

		const result = await this.noticeModel
			.aggregate<Notices>([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
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

	public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndUpdate(
				{ _id: noticeId, noticeStatus: { $ne: NoticeStatus.DELETE } },
				{ noticeStatus: NoticeStatus.DELETE },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
