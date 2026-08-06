import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AgentsInquiry, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { LoginInput } from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { ListingStatus } from '../../libs/enums/listing.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { ViewService } from '../view/view.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { lookupAuthMemberLiked } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private authService: AuthService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
	) {}

	public async signup(input: MemberInput): Promise<Member> {
		const payload: T = { ...input };
		payload.memberPassword = await this.authService.hashPassword(input.memberPassword);

		if (input.isPendingSpecialist) {
			payload.memberType = MemberType.USER;
			payload.memberStatus = MemberStatus.ACTIVE;
		}

		try {
			const result = await this.memberModel.create(payload);
			result.accessToken = await this.authService.createToken(result);

			if (result.isPendingSpecialist) {
				await this.notifyAdminsOfSpecialistApplication(result);
			}

			return result;
		} catch (err: unknown) {
			console.log('Error, Service.model:', err);
			const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
			if (mongoErr?.code === 11000) {
				if (mongoErr.keyPattern?.memberNick) {
					throw new BadRequestException(Message.DUPLICATE_MEMBER_NICK);
				}
				if (mongoErr.keyPattern?.memberPhone) {
					throw new BadRequestException(Message.DUPLICATE_MEMBER_PHONE);
				}
				throw new BadRequestException(Message.DUPLICATE_ACCOUNT);
			}
			throw err;
		}
	}

	public async applyAsSpecialist(memberId: ObjectId, memberDesc: string): Promise<Member> {
		const description = memberDesc.trim();
		if (!description) {
			throw new BadRequestException('Please describe your specialist experience');
		}
		if (description.length > 1000) {
			throw new BadRequestException('Specialist experience must be 1000 characters or fewer');
		}

		const member = await this.memberModel.findById(memberId).exec();
		if (!member || member.memberStatus !== MemberStatus.ACTIVE) {
			throw new BadRequestException(Message.NO_DATA_FOUND);
		}
		if (member.memberType === MemberType.AGENT) {
			throw new BadRequestException("You're already a specialist");
		}
		if (member.isPendingSpecialist) {
			throw new BadRequestException('You already have a pending application');
		}
		if (member.memberType !== MemberType.USER) {
			throw new BadRequestException('Only user accounts can apply as a specialist');
		}

		const result = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberType: MemberType.USER,
					memberStatus: MemberStatus.ACTIVE,
					isPendingSpecialist: { $ne: true },
				},
				{
					$set: {
						isPendingSpecialist: true,
						memberDesc: description,
					},
				},
				{ new: true },
			)
			.exec();

		if (!result) {
			throw new BadRequestException('You already have a pending application');
		}

		await this.notifyAdminsOfSpecialistApplication(result);
		result.accessToken = await this.authService.createToken(result);
		return result;
	}

	public async login(input: LoginInput): Promise<Member> {
		const { memberNick } = input;
		const response = await this.memberModel.findOne({ memberNick: memberNick }).select('+memberPassword').exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		} else if (response.memberStatus === MemberStatus.PENDING) {
			throw new InternalServerErrorException(Message.PENDING_APPROVAL);
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword);
		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);
		response.accessToken = await this.authService.createToken(response);

		return response;
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberStatus: MemberStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPLOAD_FAILED);

		result.accessToken = await this.authService.createToken(result);
		return result;
	}

	public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
		};
		const targetMember = await this.memberModel.findOne(search).lean().exec();
		if (!targetMember) {
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		}

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.memberModel.findByIdAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
				targetMember.memberViews++;
			}
			const likeInput: LikeInput = { memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
			targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

			// meFollowed

			targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
		}

		return targetMember;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel.findOne({ followingId: followingId, followerId: followerId });
		return result ? [{ followerId: followerId, followingId: followingId, myFollowing: true }] : [];
	}

	public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
		const { text } = input.search;
		const match: T = { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match:', match);

		const result = await this.memberModel
			.aggregate<Members>([
				{ $match: match },
				{
					$lookup: {
						from: 'listings',
						let: { memberId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: { $eq: ['$memberId', '$$memberId'] },
									listingStatus: ListingStatus.ACTIVE,
								},
							},
							{
								$group: {
									_id: null,
									totalLikes: { $sum: '$listingLikes' },
									count: { $sum: 1 },
								},
							},
						],
						as: 'listingStats',
					},
				},
				{
					$lookup: {
						from: 'boardArticles',
						let: { memberId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: { $eq: ['$memberId', '$$memberId'] },
									articleStatus: BoardArticleStatus.ACTIVE,
								},
							},
							{
								$group: {
									_id: null,
									totalLikes: { $sum: '$articleLikes' },
									count: { $sum: 1 },
								},
							},
						],
						as: 'articleStats',
					},
				},
				{
					$addFields: {
						profileLikes: { $ifNull: ['$memberLikes', 0] },
						totalListingLikes: {
							$ifNull: [{ $arrayElemAt: ['$listingStats.totalLikes', 0] }, 0],
						},
						totalArticleLikes: {
							$ifNull: [{ $arrayElemAt: ['$articleStats.totalLikes', 0] }, 0],
						},
						jobsCount: {
							$ifNull: [{ $arrayElemAt: ['$listingStats.count', 0] }, 0],
						},
						articlesCount: {
							$ifNull: [{ $arrayElemAt: ['$articleStats.count', 0] }, 0],
						},
					},
				},
				{
					$addFields: {
						totalEngagement: {
							$add: ['$profileLikes', '$totalListingLikes', '$totalArticleLikes'],
						},
						specialistScore: {
							$add: [
								{ $multiply: ['$profileLikes', 1] },
								{ $multiply: ['$totalListingLikes', 1.5] },
								{ $multiply: ['$totalArticleLikes', 2] },
								{ $multiply: ['$jobsCount', 5] },
								{ $multiply: ['$articlesCount', 3] },
							],
						},
					},
				},
				{
					$project: {
						listingStats: 0,
						articleStats: 0,
					},
				},
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }, lookupAuthMemberLiked(memberId)],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target: Member = await this.memberModel.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({ _id: likeRefId, targetKey: 'memberLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		if (modifier === 1) {
			try {
				const liker = await this.memberModel.findById(memberId).select('memberNick').lean().exec();
				await this.notificationService.createNotification({
					notificationType: NotificationType.LIKE,
					notificationGroup: NotificationGroup.MEMBER,
					notificationTitle: `${liker?.memberNick ?? 'Someone'} liked your profile`,
					receiverId: likeRefId,
					authorId: memberId,
					notificationRefId: memberId,
				});
			} catch (err) {
				console.log('Error, NotificationService (likeTargetMember):', err);
			}
		}

		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		if (input.search.isPendingSpecialist !== undefined) {
			match.isPendingSpecialist = input.search.isPendingSpecialist;
		}
		console.log('match:', match);

		const result = await this.memberModel
			.aggregate<Members>([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const result: Member | null = await this.memberModel
			.findByIdAndUpdate({ _id: input._id }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		console.log('memberStatsEditor executed');
		const { _id, targetKey, modifier } = input;
		return await this.memberModel
			.findByIdAndUpdate(
				_id, // filter
				{ $inc: { [targetKey]: modifier } }, //update
				{ new: true },
			)
			.exec(); // option
	}

	private async notifyAdminsOfSpecialistApplication(applicant: Member): Promise<void> {
		try {
			const admins = await this.memberModel
				.find({
					memberType: MemberType.ADMIN,
					memberStatus: MemberStatus.ACTIVE,
				})
				.select('_id')
				.lean()
				.exec();

			await Promise.all(
				admins.map((admin) =>
					this.notificationService.createNotification({
						notificationType: NotificationType.SYSTEM,
						notificationGroup: NotificationGroup.MEMBER,
						notificationTitle: `${applicant.memberNick} submitted a specialist application`,
						notificationDesc: applicant.memberDesc,
						receiverId: admin._id,
						authorId: applicant._id,
						notificationRefId: applicant._id,
					}),
				),
			);
		} catch (err) {
			console.log('Error, NotificationService (specialist application):', err);
		}
	}
}
