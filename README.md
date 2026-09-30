# PawPal API

Backend services for **PawPal**, a full-stack pet-care marketplace that connects pet owners with specialists, service providers, and pet-product sellers.

PawPal is designed as a production-focused marketplace rather than a simple CRUD demo. The backend handles authentication, marketplace listings, service bookings, inquiries, community interactions, messaging, notifications, scheduled jobs, and AI integrations.

> Live product: https://pawpall.online  
> Frontend repository: https://github.com/Max-Mukhiddin/pawpal-next  
> Portfolio: https://max-mukhiddin.github.io/homepage/

## Tech Stack

- **NestJS 10** + TypeScript
- **GraphQL** + Apollo Server
- **MongoDB** + Mongoose
- **JWT** authentication
- **WebSockets / Socket.IO**
- **Nest Schedule** for background tasks
- **OpenAI SDK** and **Anthropic SDK** integrations
- bcryptjs, class-validator, class-transformer
- Docker / nginx / Linux production workflow

## Architecture

```text
Next.js Client
      |
      v
Apollo Client / GraphQL
      |
      v
NestJS API
  |       |       |
  v       v       v
MongoDB  WebSocket  Scheduled Jobs
```

The repository is organized as a NestJS workspace and builds two applications:

- `pawpal-api` — primary GraphQL API
- `pawpal-batch` — scheduled/background processing

## Core Product Domains

### Authentication & Members

- User, Specialist, and Admin roles
- JWT-based authentication
- Account-state validation
- Password hashing with bcrypt
- Protected GraphQL operations

### Marketplace

PawPal supports two listing types:

- **PRODUCT** — pet products
- **SERVICE** — grooming, boarding, training, veterinary and other pet-care services

Service listings can include service duration and are validated separately from physical products.

### Booking Workflow

```text
REQUESTED -> CONFIRMED -> DONE
          \-> CANCELLED
```

Bookings connect customers with specialists and preserve the marketplace relationship between customer, provider, and listing.

### Customer Inquiries

Supports both guest and authenticated inquiries, including specialist/customer/listing context and inquiry-status management.

### Community

- Board articles
- Comments
- Likes
- Views
- Follow relationships
- Notifications

### Messaging

- Conversations
- Direct messages
- Real-time communication support

### Background Processing

The separate batch application is used for scheduled and asynchronous platform tasks.

## Security Notes

The project keeps runtime secrets outside the repository via environment files. `.env` and local environment variants are excluded through `.gitignore`.

Authentication tokens use a minimal identity payload, while authenticated requests resolve the member from the database so blocked or deleted accounts can be rejected at request time.

## Local Development

### Install

```bash
npm install
```

### Run API

```bash
npm run start:dev
```

### Run batch service

```bash
npm run start:dev:batch
```

### Build

```bash
npm run build
```

### Production

```bash
npm run start:prod
npm run start:prod:batch
```

## Testing

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Project Background

PawPal was built as an independent product after learning full-stack marketplace architecture through earlier course projects. The domain model, workflows, product/service logic, booking and inquiry systems, communication features, security improvements, branding, and deployment were developed for PawPal as a separate portfolio project.

## Author

**Mukhiddin “Max” Solijonov**  
Full-Stack · DevOps · AI Engineer  
South Korea

- Portfolio: https://max-mukhiddin.github.io/homepage/
- GitHub: https://github.com/Max-Mukhiddin
