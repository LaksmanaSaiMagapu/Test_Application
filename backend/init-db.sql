-- Run against your local PostgreSQL (e.g. sudo -u postgres psql -f init-db.sql)
-- to create the database and user the backend expects on localhost:5432.
CREATE USER geonexus WITH PASSWORD 'geonexus';
CREATE DATABASE geonexus OWNER geonexus;
