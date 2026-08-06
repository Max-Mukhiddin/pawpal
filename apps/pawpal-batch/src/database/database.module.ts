import { Module } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

type NodeEnv = 'development' | 'production' | 'test';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => {
				const nodeEnv = process.env.NODE_ENV as NodeEnv | undefined;
				return {
					uri: nodeEnv === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV,
				};
			},
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {
	constructor(@InjectConnection() private readonly connection: Connection) {
		if (connection.readyState === ConnectionStates.connected) {
			const nodeEnv = process.env.NODE_ENV as NodeEnv | undefined;
			console.log(`MongoDB is connected info ${nodeEnv === 'production' ? 'production' : 'development'} db`);
		} else {
			console.log('DB is not connected!');
		}
	}
}
