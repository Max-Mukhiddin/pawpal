import { BadRequestException } from '@nestjs/common';
import {
	registerDecorator,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import type { IOptions } from 'sanitize-html';

// CommonJS module — default ESM import is undefined at runtime under webpack.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- sanitize-html has no ESM default; require is required
const sanitizeHtml = require('sanitize-html') as typeof import('sanitize-html');

export const ARTICLE_CONTENT_MIN_LENGTH = 3;
export const ARTICLE_CONTENT_MAX_LENGTH = 5000;

const ARTICLE_ALLOWED_TAGS = ['h2', 'h3', 'p', 'strong', 'em', 'blockquote', 'ul', 'ol', 'li', 'img', 'a', 'br'];

const ARTICLE_SANITIZE_OPTIONS: IOptions = {
	allowedTags: ARTICLE_ALLOWED_TAGS,
	allowedAttributes: {
		a: ['href', 'title', 'target', 'rel'],
		img: ['src', 'alt', 'title'],
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	transformTags: {
		a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
	},
};

/** Strip HTML tags and collapse whitespace for visible character counting. */
export function getArticleVisibleTextLength(content: string): number {
	if (!content) return 0;

	return content
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim().length;
}

export function assertArticleContentLength(
	content: string,
	min = ARTICLE_CONTENT_MIN_LENGTH,
	max = ARTICLE_CONTENT_MAX_LENGTH,
): void {
	const visibleLength = getArticleVisibleTextLength(content);

	if (visibleLength < min || visibleLength > max) {
		throw new BadRequestException(
			`articleContent must be between ${min} and ${max} visible characters (HTML tags are not counted).`,
		);
	}
}

/**
 * Sanitize rich-text HTML. Plain-text articles (no HTML tags) are returned
 * unchanged so existing documents keep working as-is.
 */
export function sanitizeArticleContent(content: string): string {
	const trimmed = content?.trim() ?? '';
	if (!trimmed) return trimmed;

	const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmed);
	if (!hasHtmlTags) {
		return trimmed;
	}

	return sanitizeHtml(trimmed, ARTICLE_SANITIZE_OPTIONS).trim();
}

@ValidatorConstraint({ name: 'articleContentLength', async: false })
export class ArticleContentLengthConstraint implements ValidatorConstraintInterface {
	validate(value: string): boolean {
		if (typeof value !== 'string') return false;
		const visibleLength = getArticleVisibleTextLength(value);
		return visibleLength >= ARTICLE_CONTENT_MIN_LENGTH && visibleLength <= ARTICLE_CONTENT_MAX_LENGTH;
	}

	defaultMessage(): string {
		return `articleContent must be between ${ARTICLE_CONTENT_MIN_LENGTH} and ${ARTICLE_CONTENT_MAX_LENGTH} visible characters`;
	}
}

export function ArticleContentLength(validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [],
			validator: ArticleContentLengthConstraint,
		});
	};
}
