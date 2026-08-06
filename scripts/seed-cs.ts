import * as dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import NoticeSchema from '../apps/pawpal-api/src/schemas/Notice.model';
import FaqSchema from '../apps/pawpal-api/src/schemas/Faq.model';
import MemberSchema from '../apps/pawpal-api/src/schemas/Member.model';
import { NoticeCategory } from '../apps/pawpal-api/src/libs/enums/notice.enum';
import { FaqCategory } from '../apps/pawpal-api/src/libs/enums/faq.enum';
import { MemberType } from '../apps/pawpal-api/src/libs/enums/member.enum';

dotenv.config();

const Notice = mongoose.model('Notice', NoticeSchema);
const Faq = mongoose.model('Faq', FaqSchema);
const Member = mongoose.model('Member', MemberSchema);

async function seedCs() {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) {
		throw new Error('MONGO_DEV or MONGO_PROD is not set');
	}

	await mongoose.connect(uri);

	const noticeCount = await Notice.countDocuments();
	const faqCount = await Faq.countDocuments();

	if (noticeCount > 0 && faqCount > 0) {
		console.log('CS seed skipped: notices and faqs already exist.');
		await mongoose.disconnect();
		return;
	}

	const admin =
		(await Member.findOne({ memberType: MemberType.ADMIN }).select('_id').lean().exec()) ??
		(await Member.findOne().select('_id').lean().exec());

	if (!admin?._id) {
		throw new Error('No member found to use as creatorId. Create an admin user first.');
	}

	const creatorId = admin._id;

	if (noticeCount === 0) {
		await Notice.insertMany([
			{
				noticeCategory: NoticeCategory.EVENT,
				noticeTitle: 'Welcome to PawPal!',
				noticeContent:
					'Welcome to PawPal, your trusted marketplace for pet services and products in Korea. Browse specialists, book grooming and training, and shop quality pet supplies.',
				creatorId,
			},
			{
				noticeCategory: NoticeCategory.PAYMENT,
				noticeTitle: 'New payment methods added',
				noticeContent:
					'We now support additional payment options for bookings and product purchases. Check your checkout page for the latest methods available in your region.',
				creatorId,
			},
			{
				noticeCategory: NoticeCategory.TECHNICAL,
				noticeTitle: 'Scheduled maintenance on Sunday 2–4 AM KST',
				noticeContent:
					'PawPal will undergo brief scheduled maintenance. Some features may be unavailable during this window. We appreciate your patience.',
				creatorId,
			},
			{
				noticeCategory: NoticeCategory.GENERAL,
				noticeTitle: 'Updated privacy policy',
				noticeContent:
					'We have updated our privacy policy to reflect how we handle account data, bookings, and communications. Please review the latest version in your account settings.',
				creatorId,
			},
			{
				noticeCategory: NoticeCategory.EVENT,
				noticeTitle: 'Refer a friend, get 10% off',
				noticeContent:
					'Invite friends to PawPal and receive 10% off your next service booking when they complete their first appointment. Terms apply.',
				creatorId,
			},
		]);
		console.log('Seeded 5 notices.');
	}

	if (faqCount === 0) {
		await Faq.insertMany([
			{
				faqCategory: FaqCategory.PAYMENT,
				faqQuestion: 'How do refunds work?',
				faqAnswer:
					'Refunds depend on the service provider cancellation policy. Contact support with your booking ID if you need help.',
				faqOrder: 1,
				creatorId,
			},
			{
				faqCategory: FaqCategory.PAYMENT,
				faqQuestion: 'What currency does PawPal use?',
				faqAnswer: 'Prices are shown in KRW for services and products listed in Korea.',
				faqOrder: 2,
				creatorId,
			},
			{
				faqCategory: FaqCategory.PAYMENT,
				faqQuestion: 'Which payment methods are accepted?',
				faqAnswer: 'We support major cards and local payment methods shown at checkout.',
				faqOrder: 3,
				creatorId,
			},
			{
				faqCategory: FaqCategory.ACCOUNT,
				faqQuestion: 'How do I reset my password?',
				faqAnswer: 'Use the forgot password link on the login page or update your password in account settings.',
				faqOrder: 4,
				creatorId,
			},
			{
				faqCategory: FaqCategory.ACCOUNT,
				faqQuestion: 'How can I delete my account?',
				faqAnswer: 'Go to account settings and request account deletion, or contact customer support for assistance.',
				faqOrder: 5,
				creatorId,
			},
			{
				faqCategory: FaqCategory.ACCOUNT,
				faqQuestion: 'How do I verify my email?',
				faqAnswer: 'Open the verification link sent to your registered email after signup.',
				faqOrder: 6,
				creatorId,
			},
			{
				faqCategory: FaqCategory.TECHNICAL,
				faqQuestion: 'The app is not loading. What should I do?',
				faqAnswer: 'Clear your browser cache, check your connection, and try again. If the issue persists, contact support.',
				faqOrder: 7,
				creatorId,
			},
			{
				faqCategory: FaqCategory.TECHNICAL,
				faqQuestion: 'My images are not uploading.',
				faqAnswer: 'Use JPG or PNG under 15MB. Ensure you are logged in and try a stable connection.',
				faqOrder: 8,
				creatorId,
			},
			{
				faqCategory: FaqCategory.GENERAL,
				faqQuestion: 'What is PawPal?',
				faqAnswer:
					'PawPal is a pet services and products marketplace connecting pet owners with trusted specialists across Korea.',
				faqOrder: 9,
				creatorId,
			},
			{
				faqCategory: FaqCategory.GENERAL,
				faqQuestion: 'How do I contact customer support?',
				faqAnswer: 'Use the CS Center inquiry form or email support@pawpal.uz for help with your account or bookings.',
				faqOrder: 10,
				creatorId,
			},
		]);
		console.log('Seeded 10 FAQs.');
	}

	await mongoose.disconnect();
	console.log('CS seed complete.');
}

seedCs().catch((err) => {
	console.error('CS seed failed:', err);
	process.exit(1);
});
