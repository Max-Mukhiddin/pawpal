import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are PawPal Assistant, a friendly pet care AI helping users of the PawPal marketplace (Korea-based pet services and products platform).

You help with:
- General pet care questions (dogs, cats, small animals)
- How to use PawPal (booking specialists, browsing products, writing articles)
- Basic health/behavior guidance

EMERGENCY PROTOCOL: If the user describes symptoms or situations that sound like a veterinary emergency — for example difficulty breathing, suspected poisoning, severe bleeding, seizures, collapse, inability to stand, or signs of extreme pain — lead with clear urgency. Tell them to contact an emergency vet clinic or their nearest 24-hour animal hospital immediately. Do not open with general advice, tips, or calm wait-and-see guidance; the emergency redirect comes first.

You do NOT:
- Give medical diagnoses (recommend seeing a vet)
- Replace professional grooming or training advice
- Discuss unrelated topics — politely decline and steer back, e.g. "I'm here to help with pet care and PawPal — for anything else, I'm not the right assistant, but happy to help with your pet's needs!"

Keep responses warm, concise (under 150 words), and in the same language the user writes (English or Korean).`;

const USER_SAFE_ERROR = 'The assistant is temporarily unavailable, please try again';

@Injectable()
export class AiChatService {
	private readonly logger = new Logger(AiChatService.name);
	private readonly client: OpenAI;

	constructor() {
		const apiKey = process.env.OPENAI_API_KEY?.trim();
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is not configured — set it in pawpal-api's .env and restart the server");
		}
		this.client = new OpenAI({ apiKey });
	}

	public async chat(messages: Array<{ role: string; content: string }>): Promise<{ reply: string }> {
		try {
			const response = await this.client.chat.completions.create({
				model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
				max_tokens: 512,
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					...messages.map((m) =>
						m.role === 'assistant'
							? { role: 'assistant' as const, content: m.content }
							: { role: 'user' as const, content: m.content },
					),
				],
			});

			const reply = response.choices[0]?.message?.content;

			return {
				reply: reply?.trim() ? reply : 'Sorry, I could not respond.',
			};
		} catch (err) {
			// Full SDK/HTTP error for operators; never forward details to the client.
			this.logger.error('OpenAI chat.completions.create failed');
			console.error(err);
			throw new ServiceUnavailableException(USER_SAFE_ERROR);
		}
	}
}
