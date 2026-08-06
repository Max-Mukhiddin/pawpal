import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Listing } from '../../pawpal-api/src/libs/dto/listing/listing';
import { Model } from 'mongoose';
import { Member } from '../../pawpal-api/src/libs/dto/member/member';
import { ListingStatus } from '../../pawpal-api/src/libs/enums/listing.enum';
import { MemberStatus, MemberType } from '../../pawpal-api/src/libs/enums/member.enum';
@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Listing') private readonly listingModel: Model<Listing>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.listingModel
			.updateMany(
				{
					listingStatus: ListingStatus.ACTIVE,
				},
				{ listingRank: 0 },
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.AGENT,
				},
				{ memberRank: 0 },
			)
			.exec();
	}
	public async batchTopListings(): Promise<void> {
		const listings: Listing[] = await this.listingModel
			.find({
				listingStatus: ListingStatus.ACTIVE,
				listingRank: 0,
			})
			.exec();

		const promisedList = listings.map(async (ele: Listing) => {
			const { _id, listingLikes, listingViews } = ele;
			const rank = listingLikes * 2 + listingViews * 1;
			return await this.listingModel.findByIdAndUpdate(_id, { listingRank: rank });
		});

		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberListings, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberListings * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});

		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to PawPal BATCH Server!';
	}
}
