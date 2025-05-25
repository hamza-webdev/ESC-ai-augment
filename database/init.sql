-- ESC Football App Database Initialization Script
-- This script creates the database and sets up initial configuration

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE esc_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'esc_db')\gexec

-- Connect to the database
\c esc_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types/enums (these will be created by SQLAlchemy, but we can prepare them)

-- User roles enum
DO $$ BEGIN
    CREATE TYPE user_roles AS ENUM ('admin', 'coach', 'player', 'staff', 'supporter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Player positions enum
DO $$ BEGIN
    CREATE TYPE player_positions AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Player status enum
DO $$ BEGIN
    CREATE TYPE player_status AS ENUM ('active', 'injured', 'suspended', 'loaned', 'retired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Preferred foot enum
DO $$ BEGIN
    CREATE TYPE preferred_foot AS ENUM ('left', 'right', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Competition types enum
DO $$ BEGIN
    CREATE TYPE competition_types AS ENUM ('league', 'cup', 'friendly', 'playoff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Match results enum
DO $$ BEGIN
    CREATE TYPE match_results AS ENUM ('win', 'draw', 'loss', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Training types enum
DO $$ BEGIN
    CREATE TYPE training_types AS ENUM ('technical', 'physical', 'tactical', 'recovery', 'friendly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Training intensity enum
DO $$ BEGIN
    CREATE TYPE training_intensity AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Field conditions enum
DO $$ BEGIN
    CREATE TYPE field_conditions AS ENUM ('excellent', 'good', 'fair', 'poor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Effort levels enum
DO $$ BEGIN
    CREATE TYPE effort_levels AS ENUM ('poor', 'fair', 'good', 'excellent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction types enum
DO $$ BEGIN
    CREATE TYPE transaction_types AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Finance categories enum
DO $$ BEGIN
    CREATE TYPE finance_categories AS ENUM (
        'sponsorship', 'ticket_sales', 'merchandise', 'transfer_fee', 'prize_money', 'donation', 'membership_fee', 'other_income',
        'salary', 'equipment', 'travel', 'facility', 'medical', 'training', 'transfer_fee_out', 'utilities', 'insurance', 'other_expense'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction status enum
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment methods enum
DO $$ BEGIN
    CREATE TYPE payment_methods AS ENUM ('cash', 'bank_transfer', 'check', 'card', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recurring frequency enum
DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- News categories enum
DO $$ BEGIN
    CREATE TYPE news_categories AS ENUM (
        'match_report', 'transfer', 'training', 'announcement', 'interview', 
        'injury_update', 'club_news', 'community', 'achievement', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance (these will be created after tables are created by SQLAlchemy)

-- Function to create indexes after tables exist
CREATE OR REPLACE FUNCTION create_performance_indexes()
RETURNS void AS $$
BEGIN
    -- Users table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    END IF;

    -- Players table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'players') THEN
        CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
        CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
        CREATE INDEX IF NOT EXISTS idx_players_jersey_number ON players(jersey_number);
        CREATE INDEX IF NOT EXISTS idx_players_nationality ON players(nationality);
    END IF;

    -- Matches table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matches') THEN
        CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
        CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition);
        CREATE INDEX IF NOT EXISTS idx_matches_result ON matches(result);
        CREATE INDEX IF NOT EXISTS idx_matches_opponent ON matches(opponent);
    END IF;

    -- Trainings table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trainings') THEN
        CREATE INDEX IF NOT EXISTS idx_trainings_date ON trainings(date);
        CREATE INDEX IF NOT EXISTS idx_trainings_type ON trainings(type);
        CREATE INDEX IF NOT EXISTS idx_trainings_completed ON trainings(completed);
    END IF;

    -- Finances table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finances') THEN
        CREATE INDEX IF NOT EXISTS idx_finances_transaction_date ON finances(transaction_date);
        CREATE INDEX IF NOT EXISTS idx_finances_type ON finances(type);
        CREATE INDEX IF NOT EXISTS idx_finances_category ON finances(category);
        CREATE INDEX IF NOT EXISTS idx_finances_status ON finances(status);
    END IF;

    -- News table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'news') THEN
        CREATE INDEX IF NOT EXISTS idx_news_published ON news(published);
        CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
        CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
        CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
        CREATE INDEX IF NOT EXISTS idx_news_is_featured ON news(is_featured);
        CREATE INDEX IF NOT EXISTS idx_news_is_breaking ON news(is_breaking);
        
        -- Full-text search index for news
        CREATE INDEX IF NOT EXISTS idx_news_search ON news USING gin(to_tsvector('english', title || ' ' || content));
    END IF;

    -- Player stats indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'player_stats') THEN
        CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
        CREATE INDEX IF NOT EXISTS idx_player_stats_match_id ON player_stats(match_id);
    END IF;

    -- Training attendance indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_attendances') THEN
        CREATE INDEX IF NOT EXISTS idx_training_attendance_training_id ON training_attendances(training_id);
        CREATE INDEX IF NOT EXISTS idx_training_attendance_player_id ON training_attendances(player_id);
        CREATE INDEX IF NOT EXISTS idx_training_attendance_attended ON training_attendances(attended);
    END IF;

    RAISE NOTICE 'Performance indexes created successfully';
END;
$$ LANGUAGE plpgsql;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create triggers for updated_at columns
CREATE OR REPLACE FUNCTION create_updated_at_triggers()
RETURNS void AS $$
DECLARE
    table_name text;
    tables_with_updated_at text[] := ARRAY['users', 'players', 'matches', 'trainings', 'training_attendances', 'finances', 'news', 'player_stats'];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s', table_name, table_name);
            EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at 
                           BEFORE UPDATE ON %s 
                           FOR EACH ROW 
                           EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated_at triggers created successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON DATABASE esc_db TO esc_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO esc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO esc_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO esc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO esc_user;

-- Create a notification for successful initialization
DO $$
BEGIN
    RAISE NOTICE 'ESC Football App database initialized successfully!';
    RAISE NOTICE 'Database: esc_db';
    RAISE NOTICE 'User: esc_user';
    RAISE NOTICE 'Extensions and types created.';
    RAISE NOTICE 'Run the Flask application to create tables and indexes.';
END $$;
