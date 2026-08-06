# Agent / Specialist naming

## Frontend display rule

Prefer **"Specialist"** (never "Agent") in **frontend display text** and local UI-layer naming — labels, copy, component names meant for humans, etc.

## Backend contract (intentional)

That display rule applies to the UI only. The backend’s real `MemberType.AGENT` enum, database field values, and GraphQL operation / field names (`getAgents`, `agentId`, `updateBookingStatusByAgent`, `getAgentListings`, role guards, etc.) are **intentionally staying as-is for now**.

Do **not** introduce a parallel `SPECIALIST` enum value or attempt a partial rename of backend GraphQL/DB identifiers without a full coordinated migration. Doing so mid-flight will break clients and stored data.

See the comment on `MemberType` in `apps/pawpal-api/src/libs/enums/member.enum.ts`.
