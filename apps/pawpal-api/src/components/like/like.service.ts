import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Model, ObjectId } from 'mongoose';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/listing/listing.input';
import { Listing, Listings } from '../../libs/dto/listing/listing';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupFavorite } from '../../libs/config';
import { TotalCounter } from '../../libs/dto/member/member';

interface FavoriteListingsAggregation {
	list: Array<{ favoriteListing: Listing }>;
	metaCounter: TotalCounter[];
}

@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = { memberId: input.memberId, likeRefId: input.likeRefId },
			exist = await this.likeModel.findOne(search).exec();
		let modifier = 1;

		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			modifier = -1;
		} else {
			try {
				await this.likeModel.create(input);
			} catch (err) {
				console.log('Error, Service.,model:', err);
				throw new BadRequestException(Message.CREATE_FAILED);
			}
		}

		console.log(`-Like modifier ${modifier} -`);
		return modifier;
	}

	public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
		const { memberId, likeRefId } = input,
			result = await this.likeModel.findOne({ memberId: memberId, likeRefId: likeRefId }).exec();
		return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }] : [];
	}

	public async getFavoriteListings(memberId: ObjectId, input: OrdinaryInquiry): Promise<Listings> {
		const { page, limit } = input;
		const match: T = { likeGroup: LikeGroup.LISTING, memberId: memberId };

		const data = await this.likeModel
			.aggregate<FavoriteListingsAggregation>([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'listings',
						localField: 'likeRefId',
						foreignField: '_id',
						as: 'favoriteListing',
					},
				},
				{ $unwind: '$favoriteListing' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupFavorite,
							{ $unwind: '$favoriteListing.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		const facet = data[0] ?? { list: [], metaCounter: [] };
		const result: Listings = { list: [], metaCounter: facet.metaCounter };
		result.list = facet.list.map((ele) => ele.favoriteListing);
		return result;
	}
}
