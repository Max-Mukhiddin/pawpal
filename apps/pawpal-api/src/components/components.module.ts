import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ListingModule } from './listing/listing.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { BookingModule } from './booking/booking.module';
import { NotificationModule } from './notification/notification.module';
import { NoticeModule } from './notice/notice.module';
import { FaqModule } from './faq/faq.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
	imports: [
		MemberModule,
		ListingModule,
		AuthModule,
		BoardArticleModule,
		LikeModule,
		ViewModule,
		CommentModule,
		FollowModule,
		InquiryModule,
		BookingModule,
		NotificationModule,
		NoticeModule,
		FaqModule,
		MessagingModule,
	],
})
export class ComponentsModule {}
