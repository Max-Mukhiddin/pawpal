import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ConversationSchema from '../../schemas/Conversation.model';
import MessageSchema from '../../schemas/Message.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { MessagingResolver } from './messaging.resolver';
import { MessagingService } from './messaging.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Conversation', schema: ConversationSchema },
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		NotificationModule,
	],
	providers: [MessagingResolver, MessagingService],
	exports: [MessagingService],
})
export class MessagingModule {}
