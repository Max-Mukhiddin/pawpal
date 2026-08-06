import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { BatchModule } from '../src/batch.module';
import { beforeEach, describe, it } from 'node:test';

void describe('BatchController (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [BatchModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	void it('/ (GET)', async () => {
		await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
	});
});
