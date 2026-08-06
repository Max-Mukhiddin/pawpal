import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AiChatService } from './ai-chat.service';

@Controller('ai-chat')
@UseGuards(ThrottlerGuard)
export class AiChatController {
	constructor(private readonly aiChat: AiChatService) {}

	/** Guest-accessible paid API — 10 req/min/IP via ThrottlerModule in AppModule. */
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Post()
	public async chat(@Body() body: { messages: Array<{ role: string; content: string }> }) {
		// HttpExceptions (503 from service, 429 from ThrottlerGuard) pass through Nest's
		// exception filter as JSON { statusCode, message, error }.
		return await this.aiChat.chat(body.messages || []);
	}
}
