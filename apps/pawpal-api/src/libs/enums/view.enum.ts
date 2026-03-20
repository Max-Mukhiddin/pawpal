import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	LISTING = 'LISTING',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
