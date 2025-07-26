# Backend Design Document

## Overview

The Voice Reading App backend is a Fastify-based REST API that provides user management, data synchronization, AI services, and file storage for the Next.js frontend. The system is designed to be scalable, secure, and optimized for Vietnamese language processing while maintaining high performance for voice-interactive applications.

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Next.js Frontend]
        MOBILE[Mobile Apps]
    end

    subgraph "API Gateway"
        LB[Load Balancer]
        RATE[Rate Limiter]
    end

    subgraph "Application Layer"
        API[Fastify API Server]
        AUTH[Auth Service]
        SYNC[Sync Service]
        AI[AI Service]
        FILE[File Service]
    end

    subgraph "Background Processing"
        QUEUE[Job Queue - Bull]
        WORKER[Background Workers]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[(S3 Storage)]
    end

    subgraph "External Services"
        OPENAI[OpenAI API]
        EMAIL[Email Service]
    end

    FE --> LB
    MOBILE --> LB
    LB --> RATE
    RATE --> API

    API --> AUTH
    API --> SYNC
    API --> AI
    API --> FILE

    AI --> QUEUE
    QUEUE --> WORKER
    WORKER --> OPENAI

    AUTH --> DB
    SYNC --> DB
    SYNC --> REDIS
    FILE --> S3
    FILE --> DB

    API --> REDIS
    AUTH --> EMAIL
```

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify with TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+
- **Storage**: AWS S3 or compatible (Cloudflare R2)
- **Queue**: Bull/BullMQ for background jobs
- **Authentication**: JWT with refresh tokens
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston with structured logging

## Components and Interfaces

### Core Services

#### 1. Authentication Service

```typescript
interface AuthService {
  register(userData: RegisterRequest): Promise<AuthResponse>;
  login(credentials: LoginRequest): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  resetPassword(email: string): Promise<void>;
  verifyToken(token: string): Promise<UserPayload>;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### 2. Book Management Service

```typescript
interface BookService {
  uploadBook(userId: string, file: MultipartFile): Promise<Book>;
  getBooks(userId: string, filters?: BookFilters): Promise<Book[]>;
  getBook(userId: string, bookId: string): Promise<Book>;
  deleteBook(userId: string, bookId: string): Promise<void>;
  updateBookMetadata(
    userId: string,
    bookId: string,
    metadata: BookMetadata
  ): Promise<Book>;
}

interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  format: "pdf" | "epub" | "txt";
  fileUrl: string;
  textContent: string;
  metadata: BookMetadata;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. Synchronization Service

```typescript
interface SyncService {
  syncReadingPosition(userId: string, position: ReadingPosition): Promise<void>;
  syncNotes(userId: string, notes: Note[]): Promise<Note[]>;
  syncPreferences(userId: string, preferences: UserPreferences): Promise<void>;
  getFullSync(userId: string, lastSync?: Date): Promise<SyncData>;
}

interface SyncData {
  readingPositions: ReadingPosition[];
  notes: Note[];
  preferences: UserPreferences;
  lastSyncTime: Date;
}
```

#### 4. AI Processing Service

```typescript
interface AIService {
  summarizeContent(content: string, options: SummaryOptions): Promise<Summary>;
  extractKeyPoints(content: string): Promise<KeyPoint[]>;
  processVietnameseText(text: string): Promise<ProcessedText>;
}

interface SummaryOptions {
  language: "vi" | "en";
  length: "short" | "medium" | "long";
  style: "bullet" | "paragraph";
}
```

### API Routes Structure

```
/api/v1/
├── auth/
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   └── POST /reset-password
├── users/
│   ├── GET /profile
│   ├── PUT /profile
│   └── DELETE /account
├── books/
│   ├── GET /
│   ├── POST /upload
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── sync/
│   ├── POST /reading-position
│   ├── POST /notes
│   ├── POST /preferences
│   └── GET /full-sync
├── ai/
│   ├── POST /summarize
│   ├── POST /extract-points
│   └── GET /summary/:id
└── files/
    ├── GET /:id
    └── DELETE /:id
```

## Data Models

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  format VARCHAR(10) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  text_content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reading positions table
CREATE TABLE reading_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  position JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI summaries cache
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash VARCHAR(64) UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Prisma Schema

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String?
  avatarUrl     String?   @map("avatar_url")
  preferences   Json      @default("{}")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  books            Book[]
  readingPositions ReadingPosition[]
  notes            Note[]
  refreshTokens    RefreshToken[]

  @@map("users")
}

model Book {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  title       String
  author      String?
  format      String
  fileUrl     String   @map("file_url")
  fileSize    BigInt?  @map("file_size")
  textContent String?  @map("text_content")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  readingPositions ReadingPosition[]
  notes            Note[]

  @@map("books")
}
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

### Error Categories

- **Authentication Errors** (401): Invalid credentials, expired tokens
- **Authorization Errors** (403): Insufficient permissions
- **Validation Errors** (400): Invalid input data
- **Not Found Errors** (404): Resource not found
- **Rate Limit Errors** (429): Too many requests
- **Server Errors** (500): Internal server errors

## Testing Strategy

### Unit Testing

- **Service Layer**: Test business logic with mocked dependencies
- **Repository Layer**: Test database operations with test database
- **Utility Functions**: Test helper functions and transformations

### Integration Testing

- **API Endpoints**: Test complete request/response cycles
- **Database Operations**: Test with real database connections
- **External Services**: Test with mocked external APIs

### End-to-End Testing

- **User Workflows**: Test complete user journeys
- **Sync Operations**: Test multi-device synchronization
- **File Operations**: Test upload, processing, and retrieval

### Performance Testing

- **Load Testing**: Test API under concurrent load
- **Stress Testing**: Test system limits and failure modes
- **Database Performance**: Test query performance with large datasets

## Security Considerations

### Authentication & Authorization

- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Role-based access control for admin features
- Rate limiting per user and IP address

### Data Protection

- Password hashing with bcrypt (12 rounds)
- Encryption at rest for sensitive data
- HTTPS/TLS for all communications
- Input validation and sanitization

### File Security

- Virus scanning for uploaded files
- File type validation and size limits
- Secure file URLs with expiration
- Access control for file downloads

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev:dev@postgres:5432/voice_reading_dev
    volumes:
      - ./src:/app/src

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=voice_reading_dev
      - POSTGRES_USER=dev
      - POSTGRES_PASSWORD=dev
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### Production Deployment Options

#### Option 1: Railway/Render

- **API**: Single container deployment
- **Database**: Managed PostgreSQL
- **Cache**: Managed Redis
- **Storage**: AWS S3 or Cloudflare R2

#### Option 2: AWS ECS/Fargate

- **API**: ECS service with auto-scaling
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3 with CloudFront CDN

#### Option 3: Self-Hosted

- **API**: Docker containers with nginx reverse proxy
- **Database**: PostgreSQL with replication
- **Cache**: Redis cluster
- **Storage**: MinIO or S3-compatible storage

### Environment Configuration

```typescript
interface Config {
  port: number;
  database: {
    url: string;
    maxConnections: number;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  storage: {
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
  };
  email: {
    provider: string;
    apiKey: string;
    fromAddress: string;
  };
}
```

## Monitoring and Observability

### Metrics Collection

- **API Metrics**: Request count, response time, error rate
- **Database Metrics**: Connection pool, query performance
- **Cache Metrics**: Hit rate, memory usage
- **Business Metrics**: User activity, book uploads, AI usage

### Logging Strategy

```typescript
interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

### Health Checks

- **API Health**: Basic endpoint responsiveness
- **Database Health**: Connection and query tests
- **Cache Health**: Redis connectivity
- **External Services**: OpenAI API availability

This design provides a solid foundation for implementing a scalable, secure backend that supports the voice reading app's requirements while maintaining high performance and reliability.
