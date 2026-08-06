import { registerEnumType } from '@nestjs/graphql';

// NOTE: AGENT is the canonical backend role for pet care
// specialists (product name: "Specialist"). This is intentional —
// the frontend displays "Specialist" as a UI label but the
// persisted enum value, GraphQL field/operation names (getAgents,
// agentId, etc.), and role guards all remain AGENT. Do not
// introduce a separate SPECIALIST enum value without a full
// coordinated migration (see project docs for rationale).
export enum MemberType {
	USER = 'USER',
	AGENT = 'AGENT',
	ADMIN = 'ADMIN',
}
registerEnumType(MemberType, { name: 'MemberType' });

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	PENDING = 'PENDING',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}
registerEnumType(MemberStatus, { name: 'MemberStatus' });

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	TELEGRAM = 'TELEGRAM',
}

registerEnumType(MemberAuthType, { name: 'MemberAuthType' });
