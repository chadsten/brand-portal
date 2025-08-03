# Development Setup Guide

This guide will help you get the React Brand Portal running locally.

## Prerequisites

- Node.js 20+ 
- Docker Desktop (for PostgreSQL and Redis)
- npm

## Quick Start

### 1. Environment Setup

The `.env.local` file has been configured with development values that work with Docker services.

### 2. Start Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up postgres redis -d
```

Services will be available at:
- PostgreSQL: `localhost:5432` (user: postgres, password: password, database: brand_portal)
- Redis: `localhost:6379`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Database Setup

To initialize the database schema:

```bash
# Skip environment validation for initial setup
SKIP_ENV_VALIDATION=1 npm run db:push
```

## Optional Services

### MinIO (S3-compatible storage)

If you need file upload functionality:

```bash
# Start MinIO
docker-compose -f docker-compose.dev.yml up minio -d
```

MinIO will be available at:
- API: http://localhost:9000
- Console: http://localhost:9001 (user: minioadmin, password: minioadmin123)

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run typecheck` - Check for TypeScript errors
- `npm run check` - Run linting checks
- `npm run db:push` - Push schema changes to database (use with SKIP_ENV_VALIDATION=1 if needed)

## Troubleshooting

### Environment Variables Error

If you get "Invalid environment variables" error:
1. Make sure Docker services are running
2. Check that `.env.local` file exists
3. Use `SKIP_ENV_VALIDATION=1` prefix for database commands

### Port Conflicts

If ports are already in use:
- PostgreSQL: Change port in docker-compose.dev.yml and update DATABASE_URL
- Redis: Change port in docker-compose.dev.yml and update REDIS_URL
- Next.js: Use `npm run dev -- -p 3001` for a different port

## Next Steps

1. Run database migrations to set up the schema
2. Create a super admin user
3. Start building!