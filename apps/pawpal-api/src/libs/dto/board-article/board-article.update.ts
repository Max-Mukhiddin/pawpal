import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, ValidateIf } from 'class-validator';
import { ArticleContentLength } from '../../utils/article-content';
import { BoardArticleStatus } from '../../enums/board-article.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class BoardArticleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => BoardArticleStatus, { nullable: true })
	articleStatus?: BoardArticleStatus;

	@IsOptional()
	@Length(3, 50)
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@ValidateIf((_, value) => value !== undefined && value !== null)
	@ArticleContentLength()
	@Field(() => String, { nullable: true })
	articleContent?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;
}
