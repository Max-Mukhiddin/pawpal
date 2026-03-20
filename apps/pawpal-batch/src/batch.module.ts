import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import ListingSchema from '../../pawpal-api/src/schemas/Listing.model';
import MemberSchema from '../../pawpal-api/src/schemas/Member.model';
import { DatabaseModule } from './database/database.module';
import { BatchController } from './batch.controller';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([{ name: 'Listing', schema: ListingSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}
