import { Schema } from 'mongoose';
import { ListingLocation, ListingStatus, ListingType } from '../libs/enums/listing.enum';

const ListingSchema = new Schema(
	{
		listingType: {
			type: String,
			enum: ListingType,
			required: true,
		},

		listingStatus: {
			type: String,
			enum: ListingStatus,
			default: ListingStatus.ACTIVE,
		},

		listingLocation: {
			type: String,
			enum: ListingLocation,
			required: true,
		},

		listingAddress: {
			type: String,
			required: true,
		},

		listingTitle: {
			type: String,
			required: true,
		},

		listingPrice: {
			type: Number,
			required: true,
		},

		durationMinutes: {
			type: Number,
			default: null,
		},

		listingViews: {
			type: Number,
			default: 0,
		},

		listingLikes: {
			type: Number,
			default: 0,
		},

		listingComments: {
			type: Number,
			default: 0,
		},

		listingRank: {
			type: Number,
			default: 0,
		},

		listingImages: {
			type: [String],
			required: true,
		},

		listingDesc: {
			type: String,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		soldAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'listings' },
);

ListingSchema.index({ listingType: 1, listingLocation: 1, listingTitle: 1, listingPrice: 1 }, { unique: true });

export default ListingSchema;
