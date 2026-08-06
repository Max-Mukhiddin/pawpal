import { Module } from '@nestjs/common';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import CommentSchema from '../../schemas/Comment.model';
import ListingSchema from '../../schemas/Listing.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ListingModule } from '../listing/listing.module';
import { BoardArticleModule } from '../board-article/board-article.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Comment',
				schema: CommentSchema,
			},
			{
				name: 'Listing',
				schema: ListingSchema,
			},
			{
				name: 'BoardArticle',
				schema: BoardArticleSchema,
			},
		]),
		AuthModule,
		MemberModule,
		ListingModule,
		BoardArticleModule,
		NotificationModule,
	],
	providers: [CommentResolver, CommentService],
})
export class CommentModule {}
