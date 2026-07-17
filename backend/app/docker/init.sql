CREATE DATABASE b2b_platform_test;
GRANT ALL PRIVILEGES ON DATABASE b2b_platform_test TO b2b_admin;

-- Requires image pgvector/pgvector:pg15 (see docker-compose.yml).
-- This script runs only on first volume init (empty data dir).
-- Entrypoint connects to POSTGRES_DB (b2b_platform) first.
CREATE EXTENSION IF NOT EXISTS vector;

\c b2b_platform_test
CREATE EXTENSION IF NOT EXISTS vector;
