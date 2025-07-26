# Voice Reading App

A voice-interactive reading application designed for visually impaired users, featuring Vietnamese language support, AI-powered summarization, and multi-device synchronization.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Next.js 15 application with voice interaction
- **Backend**: Fastify API server with PostgreSQL and Redis
- **Shared**: Common TypeScript types and utilities

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

### Development Setup

1. **Clone and install dependencies**:

```bash
git clone <repository-url>
cd voice-reading-app
npm install
```

2. **Start development services**:

```bash
# Start PostgreSQL, Redis, and MinIO
npm run docker:dev

# In another terminal, start the backend
cd backend
npm run dev

# In another terminal, start the frontend
cd frontend
npm run dev
```

3. **Access the applications**:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

### Environment Configuration

1. **Backend**: Copy `backend/.env.example` to `backend/.env` and configure:

   - Add your OpenAI API key
   - Configure email service (optional)

2. **Database Setup**:

```bash
cd backend
npm run db:generate
npm run db:migrate
```

## 📁 Project Structure

```
voice-reading-app/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── package.json
├── backend/                  # Fastify API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── config/          # Configuration
│   ├── prisma/              # Database schema
│   └── package.json
├── shared/                   # Shared code
│   ├── src/
│   │   ├── types/           # Common types
│   │   ├── utils/           # Shared utilities
│   │   └── validation/      # Zod schemas
│   └── package.json
├── docker-compose.dev.yml    # Development services
└── package.json              # Root workspace config
```

## 🛠️ Development Commands

### Root Level

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both applications
npm run test             # Run all tests
npm run docker:dev       # Start development services
npm run docker:down      # Stop development services
```

### Frontend

```bash
cd frontend
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Backend

```bash
cd backend
npm run dev              # Start Fastify dev server
npm run build            # Build TypeScript
npm run start            # Start production server
npm run test             # Run Jest tests
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
```

### Shared

```bash
cd shared
npm run build            # Build shared types
npm run dev              # Watch mode for development
```

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret (32+ characters)
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `S3_*`: File storage configuration

### Database

The backend uses PostgreSQL with Prisma ORM:

```bash
# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Open database browser
npm run db:studio
```

## 🧪 Testing

### Unit Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

### Integration Tests

```bash
# API integration tests
cd backend && npm run test:integration
```

## 📦 Deployment

### Development

- Frontend: Runs on port 3000
- Backend: Runs on port 8000
- PostgreSQL: Port 5432
- Redis: Port 6379
- MinIO: Ports 9000/9001

### Production Options

1. **Vercel + Railway**:

   - Frontend: Deploy to Vercel
   - Backend: Deploy to Railway
   - Database: Railway PostgreSQL

2. **Docker Deployment**:

   - Use `docker-compose.prod.yml` (to be created)
   - Deploy to any Docker-compatible platform

3. **AWS/Cloud**:
   - Frontend: Vercel/Netlify
   - Backend: ECS/Fargate
   - Database: RDS PostgreSQL
   - Storage: S3

## 🎯 Features

### Current (Frontend)

- ✅ Voice recognition (Vietnamese)
- ✅ Text-to-speech
- ✅ Book file processing (PDF, EPUB, TXT)
- ✅ Offline storage with IndexedDB
- ✅ Accessibility-first design

### Planned (Backend)

- 🔄 User authentication and profiles
- 🔄 Multi-device synchronization
- 🔄 AI-powered summarization
- 🔄 Cloud file storage
- 🔄 Advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Note**: This is an accessibility-first application designed for visually impaired users. All development should prioritize screen reader compatibility and keyboard navigation.
