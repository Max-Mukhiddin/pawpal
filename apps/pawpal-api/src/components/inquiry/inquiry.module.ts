import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import InquirySchema from '../../schemas/Inquiry.model';
import { InquiryResolver } from './inquiry.resolver';
import { InquiryService } from './inquiry.service';
import { AuthModule } from '../auth/auth.module';
import PropertySchema from '../../schemas/Property.model'

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Inquiry',
				schema: InquirySchema,
			},
			{ name: 'Property', schema: PropertySchema },
		]),
		AuthModule,
	],
	providers: [InquiryResolver, InquiryService],
})
export class InquiryModule {}

