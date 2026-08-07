import { ObjectId as BsonObjectId } from 'bson';
import type { ObjectId as MongooseObjectId } from 'mongoose';

export const availableAgentSorts = [
	'createdAt',
	'updatedAt',
	'memberLikes',
	'memberViews',
	'memberRank',
	'specialistScore',
	'totalEngagement',
	'jobsCount',
	'articlesCount',
];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];

export const availableListingSorts = [
	'createdAt',
	'updatedAt',
	'listingLikes',
	'listingViews',
	'listingRank',
	'listingPrice',
];

export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];

/**  IMAGE CONFIGURATION  **/
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

/** Folders under uploads/ that clients may write to. Anything else is rejected. */
export const validUploadTargets = ['member', 'listing', 'article', 'board'] as const;
export type UploadTarget = (typeof validUploadTargets)[number];

export const isValidUploadTarget = (target: string): target is UploadTarget =>
	(validUploadTargets as readonly string[]).includes(target);

export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

/** Accept GraphQL string ids or existing ObjectId values; always return a mongoose-typed ObjectId. */
export const shapeIntoMongoObjectId = (target: string | MongooseObjectId | BsonObjectId): MongooseObjectId => {
	if (typeof target === 'string') {
		return new BsonObjectId(target) as unknown as MongooseObjectId;
	}
	return target as unknown as MongooseObjectId;
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$likeRefId', '$$localLikeRefId'] }, { $eq: ['$memberId', '$$localMemberId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T;
	followingId: string;
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$followerId', '$$localFollowerId'] }, { $eq: ['$followingId', '$$localFollowingId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupAuthor = {
	$lookup: {
		from: 'members',
		localField: 'authorId',
		foreignField: '_id',
		as: 'authorData',
	},
};

export const lookupListing = {
	$lookup: {
		from: 'listings',
		localField: 'listingId',
		foreignField: '_id',
		as: 'listingData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupFavorite = {
	$lookup: {
		from: 'members',
		localField: 'favoriteListing.memberId',
		foreignField: '_id',
		as: 'favoriteListing.memberData',
	},
};

export const lookupVisit = {
	$lookup: {
		from: 'members',
		localField: 'visitedListing.memberId',
		foreignField: '_id',
		as: 'visitedListing.memberData',
	},
};
