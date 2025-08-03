-- Initialize Brand Portal Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create performance indexes after tables are created by Drizzle
-- These will be applied by the application on startup