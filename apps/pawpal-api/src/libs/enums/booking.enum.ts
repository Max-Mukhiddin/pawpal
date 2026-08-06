import { registerEnumType } from '@nestjs/graphql';

export enum BookingStatus {
	REQUESTED = 'REQUESTED',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	DONE = 'DONE',
}
registerEnumType(BookingStatus, {
	name: 'BookingStatus',
});
