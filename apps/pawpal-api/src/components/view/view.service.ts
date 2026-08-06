import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Listings, Listing } from '../../libs/dto/listing/listing';
import { OrdinaryInquiry } from '../../libs/dto/listing/listing.input';
import { lookupVisit } from '../../libs/config';
import { TotalCounter } from '../../libs/dto/member/member';

interface VisitedListingsAggregation {
	list: Array<{ visitedListing: Listing }>;
	metaCounter: TotalCounter[];
}

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistance(input);
		if (!viewExist) {
			console.log('- New View Insert -');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExistance(input: ViewInput): Promise<View | null> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedListings(memberId: ObjectId, input: OrdinaryInquiry): Promise<Listings> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.LISTING, memberId: memberId };

		const data = await this.viewModel
			.aggregate<VisitedListingsAggregation>([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'listings',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedListing',
					},
				},
				{ $unwind: '$visitedListing' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupVisit,
							{ $unwind: '$visitedListing.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		const facet = data[0] ?? { list: [], metaCounter: [] };
		const result: Listings = { list: [], metaCounter: facet.metaCounter };
		result.list = facet.list.map((ele) => ele.visitedListing);
		return result;
	}
}
