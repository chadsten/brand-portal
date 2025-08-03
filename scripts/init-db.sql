-- Brand Portal Database Initialization Script
-- This script sets up the basic database structure and permissions

-- Create additional database users if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'brandportal_readonly') THEN
    CREATE ROLE brandportal_readonly WITH LOGIN PASSWORD 'readonly123';
  END IF;
END
$$;

-- Grant basic permissions
GRANT CONNECT ON DATABASE brand_portal TO brandportal_readonly;
GRANT USAGE ON SCHEMA public TO brandportal_readonly;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create basic tables (Drizzle will handle the rest)
-- This is just to ensure the database is properly initialized

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Connection settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Logging
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = 'log';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Reload configuration
SELECT pg_reload_conf();

-- Create a health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(status text, timestamp timestamptz, connections integer)
LANGUAGE SQL
AS $$
  SELECT 
    'healthy'::text as status,
    NOW() as timestamp,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::integer as connections;
$$;