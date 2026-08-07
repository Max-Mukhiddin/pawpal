import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { SocketModule } from './socket/socket.module';
import { AiChatModule } from './components/ai-chat/ai-chat.module';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

interface GraphQLErrorExtensions {
	code?: string;
	exception?: { responce?: { message?: string | string[] } };
	responce?: { message?: string | string[] };
}

@Module({
	imports: [
		ConfigModule.forRoot(),
		ThrottlerModule.forRoot({
			throttlers: [{ name: 'default', ttl: 60000, limit: 10 }],
			errorMessage: 'Too many requests, please wait a moment and try again',
		}),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: true,
			introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: GraphQLError): GraphQLFormattedError => {
				const extensions = error.extensions as GraphQLErrorExtensions | undefined;
				const graphqlFormattedError = {
					code: extensions?.code,
					message: extensions?.exception?.responce?.message || extensions?.responce?.message || error.message,
				};
				console.log('GRAPHQL GLOBAL ERR:', graphqlFormattedError);
				return graphqlFormattedError as GraphQLFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
		AiChatModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
