import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { JwtService } from '@nestjs/jwt';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

type MemberWithDoc = Member & {
	_doc?: Record<string, unknown>;
	[key: string]: unknown;
};

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const payload: T = {};
		const memberRecord = member as MemberWithDoc;
		const source: Record<string, unknown> = memberRecord['_doc'] ? memberRecord['_doc'] : memberRecord;
		Object.keys(source).map((ele) => {
			payload[`${ele}`] = source[`${ele}`];
		});
		delete payload.memberPassword;
		console.log('payload:', payload);

		return await this.jwtService.signAsync(payload);
	}

	public async verifyToken(token: string): Promise<Member> {
		const member = await this.jwtService.verifyAsync<Member>(token);
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}
}
