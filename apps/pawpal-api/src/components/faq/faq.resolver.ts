import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { Faq, Faqs } from '../../libs/dto/faq/faq';
import { FaqInput, FaqsInquiry, FaqUpdate } from '../../libs/dto/faq/faq.input';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';

@Resolver()
export class FaqResolver {
	constructor(private readonly faqService: FaqService) {}

	@UseGuards(WithoutGuard)
	@Query(() => Faq)
	public async getFaq(@Args('faqId') input: string): Promise<Faq> {
		console.log('Query: getFaq');
		const faqId = shapeIntoMongoObjectId(input);
		return await this.faqService.getFaq(faqId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Faqs)
	public async getFaqs(@Args('input') input: FaqsInquiry): Promise<Faqs> {
		console.log('Query: getFaqs');
		return await this.faqService.getFaqs(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Faq)
	public async createFaq(@Args('input') input: FaqInput, @AuthMember('_id') memberId: ObjectId): Promise<Faq> {
		console.log('Mutation: createFaq');
		return await this.faqService.createFaq(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Faq)
	public async updateFaq(@Args('input') input: FaqUpdate): Promise<Faq> {
		console.log('Mutation: updateFaq');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.faqService.updateFaq(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Faq)
	public async removeFaqByAdmin(@Args('faqId') input: string): Promise<Faq> {
		console.log('Mutation: removeFaqByAdmin');
		const faqId = shapeIntoMongoObjectId(input);
		return await this.faqService.removeFaqByAdmin(faqId);
	}
}
