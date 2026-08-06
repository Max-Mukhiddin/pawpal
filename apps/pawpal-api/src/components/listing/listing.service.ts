import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Listings, Listing } from '../../libs/dto/listing/listing';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	AgentListingsInquiry,
	AllListingsInquiry,
	OrdinaryInquiry,
	ListingsInquiry,
	ListingInput,
} from '../../libs/dto/listing/listing.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { ListingStatus, ListingType } from '../../libs/enums/listing.enum';
import * as moment from 'moment';
import { ListingUpdate } from '../../libs/dto/listing/listing.update';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class ListingService {
	constructor(
		@InjectModel('Listing') private readonly listingModel: Model<Listing>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
	) {}

	public async createListing(input: ListingInput): Promise<Listing> {
		if (input.listingType === ListingType.SERVICE) {
			if (input.durationMinutes == null || input.durationMinutes < 1) {
				throw new BadRequestException('durationMinutes must be provided and >= 1 for service listings');
			}
		} else if (input.listingType === ListingType.PRODUCT) {
			input.durationMinutes = null; // product listings do not have a booking duration
		}

		try {
			const result = await this.listingModel.create(input);

			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberListings', modifier: 1 });

			return result;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getListing(memberId: ObjectId, listingId: ObjectId): Promise<Listing> {
		const search: T = {
			_id: listingId,
			listingStatus: ListingStatus.ACTIVE,
		};

		const targetListing: Listing = await this.listingModel.findOne(search).lean().exec();

		if (!targetListing) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = {
				memberId: memberId,
				viewRefId: listingId,
				viewGroup: ViewGroup.LISTING,
			};

			const newView = await this.viewService.recordView(viewInput);

			if (newView) {
				await this.listingStatsEditor({
					_id: listingId,
					targetKey: 'listingViews',
					modifier: 1,
				});

				targetListing.listingViews++;
			}
			const likeInput: LikeInput = { memberId, likeRefId: listingId, likeGroup: LikeGroup.LISTING };
			targetListing.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetListing.memberData = await this.memberService.getMember(null, targetListing.memberId);

		return targetListing;
	}

	public async listingStatsEditor(input: StatisticModifier): Promise<Listing> {
		const { _id, targetKey, modifier } = input;

		return await this.listingModel
			.findByIdAndUpdate({ _id }, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();
	}

	public async updateListing(memberId: ObjectId, input: ListingUpdate): Promise<Listing> {
		if (input.listingType === ListingType.SERVICE && input.durationMinutes != null) {
			if (input.durationMinutes < 1) {
				throw new BadRequestException('durationMinutes must be >= 1 for service listings');
			}
		} else if (input.listingType === ListingType.PRODUCT) {
			input.durationMinutes = null;
		}

		const { listingStatus } = input;
		let { soldAt, deletedAt } = input;
		const search: T = {
			_id: input._id,
			memberId: memberId,
			listingStatus: ListingStatus.ACTIVE,
		};

		if (listingStatus === ListingStatus.SOLD) soldAt = moment().toDate();
		else if (listingStatus === ListingStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.listingModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberListings',
				modifier: -1,
			});
		}

		return result;
	}

	public async getListings(memberId: ObjectId, input: ListingsInquiry): Promise<Listings> {
		const match: T = { listingStatus: ListingStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.listingModel
			.aggregate<Listings>([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },

							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeMatchQuery(match: T, input: ListingsInquiry): void {
		const { memberId, typeList, periodsRange, pricesRange, text } = input.search;

		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (typeList && typeList.length) match.listingType = { $in: typeList };

		if (pricesRange) match.listingPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };

		if (text) match.listingTitle = { $regex: new RegExp(text, 'i') };
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Listings> {
		return await this.likeService.getFavoriteListings(memberId, input);
	}
	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Listings> {
		return await this.viewService.getVisitedListings(memberId, input);
	}

	public async getAgentListings(memberId: ObjectId, input: AgentListingsInquiry): Promise<Listings> {
		const { listingStatus } = input.search;
		if (listingStatus === ListingStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			listingStatus: listingStatus ?? { $ne: ListingStatus.DELETE },
		};

		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.listingModel
			.aggregate<Listings>([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetListing(memberId: ObjectId, likeRefId: ObjectId): Promise<Listing> {
		const target = await this.listingModel.findOne({ _id: likeRefId, listingStatus: ListingStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId,
			likeRefId,
			likeGroup: LikeGroup.LISTING,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.listingStatsEditor({ _id: likeRefId, targetKey: 'listingLikes', modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		if (modifier === 1) {
			try {
				const liker = await this.memberService.getMember(null, memberId);
				await this.notificationService.createNotification({
					notificationType: NotificationType.LIKE,
					notificationGroup: NotificationGroup.LISTING,
					notificationTitle: `${liker.memberNick} liked your ${target.listingType}`,
					receiverId: target.memberId,
					authorId: memberId,
					notificationRefId: likeRefId,
				});
			} catch (err) {
				console.log('Error, NotificationService (likeTargetListing):', err);
			}
		}

		return result;
	}

	public async getAllListingsByAdmin(input: AllListingsInquiry): Promise<Listings> {
		const { listingStatus, listingLocationList } = input.search;
		const match: T = {};
		const sort: T = { [input?.direction ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (listingStatus) match.listingStatus = listingStatus;
		if (listingLocationList) match.listingLocation = { $in: listingLocationList };

		const result = await this.listingModel
			.aggregate<Listings>([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateListingByAdmin(input: ListingUpdate): Promise<Listing> {
		const { listingStatus } = input;
		let { soldAt, deletedAt } = input;
		const search = {
			_id: input._id,
			listingStatus: ListingStatus.ACTIVE,
		};

		if (listingStatus === ListingStatus.SOLD) soldAt = moment().toDate();
		else if (listingStatus === ListingStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.listingModel.findOneAndUpdate(search, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberListings',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeListingByAdmin(listingId: ObjectId): Promise<Listing> {
		const search: T = { _id: listingId, listingStatus: ListingStatus.DELETE };
		const result = await this.listingModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
