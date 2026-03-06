import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BookingSchema from '../../schemas/Booking.model';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import { AuthModule } from '../auth/auth.module';
import PropertySchema from '../../schemas/Property.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Booking',
				schema: BookingSchema,
			},
			{
				name: 'Property',
				schema: PropertySchema,
			},
		]),
		AuthModule,
	],
	providers: [BookingResolver, BookingService],
})
export class BookingModule {}

