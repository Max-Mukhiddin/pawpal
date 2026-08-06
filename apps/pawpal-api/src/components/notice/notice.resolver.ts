import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticesInquiry, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';

@Resolver()
export class NoticeResolver {
	constructor(private readonly noticeService: NoticeService) {}

	@UseGuards(WithoutGuard)
	@Query(() => Notice)
	public async getNotice(@Args('noticeId') input: string): Promise<Notice> {
		console.log('Query: getNotice');
		const noticeId = shapeIntoMongoObjectId(input);
		return await this.noticeService.getNotice(noticeId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Notices)
	public async getNotices(@Args('input') input: NoticesInquiry): Promise<Notices> {
		console.log('Query: getNotices');
		return await this.noticeService.getNotices(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Notice)
	public async createNotice(@Args('input') input: NoticeInput, @AuthMember('_id') memberId: ObjectId): Promise<Notice> {
		console.log('Mutation: createNotice');
		return await this.noticeService.createNotice(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Notice)
	public async updateNotice(@Args('input') input: NoticeUpdate): Promise<Notice> {
		console.log('Mutation: updateNotice');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.noticeService.updateNotice(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Notice)
	public async removeNoticeByAdmin(@Args('noticeId') input: string): Promise<Notice> {
		console.log('Mutation: removeNoticeByAdmin');
		const noticeId = shapeIntoMongoObjectId(input);
		return await this.noticeService.removeNoticeByAdmin(noticeId);
	}
}
