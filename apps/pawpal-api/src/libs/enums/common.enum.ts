import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',
	UPLOAD_FAILED = 'Upload failed!',
	BAD_REQUEST = 'Bad Request',

	USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone',
	DUPLICATE_MEMBER_NICK = 'This nickname is already taken. Please choose another.',
	DUPLICATE_MEMBER_PHONE = 'This phone number is already registered.',
	DUPLICATE_ACCOUNT = 'This account information already exists.',
	NO_MEMBER_NICK = 'No account found with that nickname.',
	BLOCKED_USER = 'You have been blocked!',
	PENDING_APPROVAL = 'Your specialist application is pending admin approval.',
	WRONG_PASSWORD = 'Incorrect password. Please try again.',
	NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
	NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
	PROVIDE_ALLOWED_TARGET = 'Please provide a valid upload target: member, listing, article or board!',
	SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}
registerEnumType(Direction, { name: 'Direction' });
