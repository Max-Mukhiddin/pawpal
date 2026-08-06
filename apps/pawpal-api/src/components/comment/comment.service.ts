import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { MemberService } from '../member/member.service';
import { ListingService } from '../listing/listing.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { InjectModel } from '@nestjs/mongoose';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { ListingStatus, ListingType } from '../../libs/enums/listing.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { Listing } from '../../libs/dto/listing/listing';
import { BoardArticle } from '../../libs/dto/board-article/board-article';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Listing') private readonly listingModel: Model<Listing>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
		private readonly listingService: ListingService,
		private readonly boardArticleService: BoardArticleService,
		private readonly notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;

		let result: Comment | null = null;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		switch (input.commentGroup) {
			case CommentGroup.LISTING:
				await this.listingService.listingStatsEditor({
					_id: input.commentRefId,
					targetKey: 'listingComments',
					modifier: 1,
				});
				break;
			case CommentGroup.ARTICLE:
				await this.boardArticleService.boardArticleStatsEditor({
					_id: input.commentRefId,
					targetKey: 'articleComments',
					modifier: 1,
				});
				break;
			case CommentGroup.MEMBER:
				await this.memberService.memberStatsEditor({
					_id: input.commentRefId,
					targetKey: 'memberComments',
					modifier: 1,
				});
				break;
		}

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);

		try {
			const commenter = await this.memberService.getMember(null, memberId);
			let receiverId: ObjectId | null = null;
			let targetLabel = 'content';
			let notificationGroup = NotificationGroup.MEMBER;

			switch (input.commentGroup) {
				case CommentGroup.LISTING: {
					const listing = await this.listingModel
						.findOne({ _id: input.commentRefId, listingStatus: ListingStatus.ACTIVE })
						.select('memberId listingType')
						.lean()
						.exec();
					if (listing) {
						receiverId = listing.memberId;
						targetLabel = listing.listingType === ListingType.SERVICE ? 'service' : 'product';
						notificationGroup = NotificationGroup.LISTING;
					}
					break;
				}
				case CommentGroup.ARTICLE: {
					const article = await this.boardArticleModel
						.findOne({ _id: input.commentRefId, articleStatus: BoardArticleStatus.ACTIVE })
						.select('memberId')
						.lean()
						.exec();
					if (article) {
						receiverId = article.memberId;
						targetLabel = 'article';
						notificationGroup = NotificationGroup.ARTICLE;
					}
					break;
				}
				case CommentGroup.MEMBER:
					receiverId = input.commentRefId;
					targetLabel = 'profile';
					notificationGroup = NotificationGroup.MEMBER;
					break;
			}

			if (receiverId) {
				await this.notificationService.createNotification({
					notificationType: NotificationType.COMMENT,
					notificationGroup,
					notificationTitle: `${commenter.memberNick} commented on your ${targetLabel}`,
					receiverId,
					authorId: memberId,
					notificationRefId: input.commentRefId,
				});
			}
		} catch (err) {
			console.log('Error, NotificationService (createComment):', err);
		}

		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.commentModel
			.aggregate<Comments>([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meLiked
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

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(input).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
