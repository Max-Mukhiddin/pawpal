import { registerEnumType } from '@nestjs/graphql';

export enum ListingType {
	PRODUCT = 'PRODUCT',
	SERVICE = 'SERVICE',
}
registerEnumType(ListingType, {
	name: 'ListingType',
});

export enum ListingStatus {
	ACTIVE = 'ACTIVE',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(ListingStatus, {
	name: 'ListingStatus',
});

export enum ListingLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(ListingLocation, {
	name: 'ListingLocation',
});
