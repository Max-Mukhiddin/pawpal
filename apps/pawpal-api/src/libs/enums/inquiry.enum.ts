import { registerEnumType } from '@nestjs/graphql';

export enum InquiryStatus {
	NEW = 'NEW',
	RESPONDED = 'RESPONDED',
	CLOSED = 'CLOSED',
}
registerEnumType(InquiryStatus, {
	name: 'InquiryStatus',
});

