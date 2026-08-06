import { Module } from '@nestjs/common';
import { ListingResolver } from './listing.resolver';
import { ListingService } from './listing.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import ListingSchema from '../../schemas/Listing.model';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Listing', schema: ListingSchema }]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
		NotificationModule,
	],
	providers: [ListingResolver, ListingService],
	exports: [ListingService],
})
export class ListingModule {}
