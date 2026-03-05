import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import PropertySchema from '../../pawpal-api/src/schemas/Property.model';
import MemberSchema from '../../pawpal-api/src/schemas/Member.model';
import { DatabaseModule } from './database/database.module';
import { BatchController } from './batch.controller';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}
