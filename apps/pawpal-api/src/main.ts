import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Message } from './libs/enums/common.enum';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as fs from 'fs';

async function bootstrap() {
	for (const dir of ['uploads/member', 'uploads/listing', 'uploads/article']) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}

	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: (errors: ValidationError[]) => {
				const messages: string[] = [];
				const collect = (validationErrors: ValidationError[]) => {
					for (const error of validationErrors) {
						if (error.constraints) {
							messages.push(...Object.values(error.constraints));
						}
						if (error.children?.length) {
							collect(error.children);
						}
					}
				};
				collect(errors);
				return new BadRequestException(messages[0] ?? Message.BAD_REQUEST);
			},
		}),
	);
	app.useGlobalInterceptors(new LoggingInterceptor());
	app.enableCors({ origin: true, credentials: true });

	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use('/uploads', express.static('./uploads'));

	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
