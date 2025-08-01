# Migration to Supabase

This document outlines the migration from MongoDB to Supabase PostgreSQL.

## Why Migrate to Supabase?

1. **Serverless-First**: No connection pooling issues in Vercel
2. **REST API**: Built-in REST API with authentication
3. **Real-time**: Built-in real-time subscriptions
4. **Better Performance**: PostgreSQL is generally faster for structured data
5. **Row Level Security**: Built-in security policies
6. **Dashboard**: Built-in admin dashboard for data management

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 2. Run Database Schema

Execute the SQL in `supabase-schema.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase-schema.sql
```

### 3. Configure Environment Variables

Copy `.env.supabase` to `.env` and fill in your values:

```bash
cp .env.supabase .env
```

Required variables:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for admin operations)
- `JWT_SECRET`: Your JWT secret for token signing

### 4. Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Key Changes Made

### Database Operations

- **MongoDB Collections** → **PostgreSQL Tables**
- **Mongoose Models** → **Supabase Client Operations**
- **ObjectId** → **UUID**
- **camelCase** → **snake_case** (PostgreSQL convention)

### Field Mappings

| MongoDB | Supabase PostgreSQL |
|---------|-------------------|
| `_id` | `id` (UUID) |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `isEmailVerified` | `is_email_verified` |
| `emailVerificationToken` | `email_verification_token` |

### Auth Routes

- Replaced all Mongoose operations with Supabase client calls
- Manual password hashing with bcrypt
- JWT token generation
- No more connection buffering issues!

### Benefits Realized

1. **No Connection Issues**: Supabase handles connections automatically
2. **Faster Queries**: PostgreSQL performance improvements
3. **Built-in Auth**: Can optionally use Supabase Auth later
4. **Real-time Ready**: Easy to add real-time features
5. **Better Scaling**: Automatic connection pooling

## Data Migration (Optional)

If you have existing MongoDB data to migrate:

1. Export MongoDB data: `mongoexport --collection=users --db=yourdb --out=users.json`
2. Transform data format (camelCase → snake_case, ObjectId → UUID)
3. Import to Supabase using the dashboard or API

## Testing

Test the migration:

1. **Health Check**: `GET /api/health`
2. **Database Test**: `GET /api/test-db`
3. **User Registration**: `POST /api/auth/register`
4. **User Login**: `POST /api/auth/login`

## Rollback Plan

If issues occur:
1. Keep MongoDB code in git history
2. Revert environment variables
3. Re-enable MongoDB connections
4. Deploy previous version

## Next Steps

1. Migrate other routes (users, profiles, cards, analytics)
2. Update frontend to handle new data structure
3. Implement Supabase Row Level Security
4. Consider using Supabase Auth for better integration