
-- ==========================================
-- MIGRATION 000: INITIAL TABLES
-- ==========================================

-- ==========================================
-- TABLE: users
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    role VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    salesforce_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(20),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS salesforce_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id
ON users(telegram_id);

-- ==========================================
-- TABLE: outlet_visit_schedules
-- LEGACY STRUCTURE
-- ==========================================

CREATE TABLE IF NOT EXISTS outlet_visit_schedules (
    id BIGSERIAL PRIMARY KEY,
    outlet_id VARCHAR(50) NOT NULL,
    no_rs VARCHAR(50) NOT NULL,
    outlet_name VARCHAR(255) NOT NULL,
    day VARCHAR(20) NOT NULL,
    salesforce_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE outlet_visit_schedules
ADD COLUMN IF NOT EXISTS outlet_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS no_rs VARCHAR(50),
ADD COLUMN IF NOT EXISTS outlet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS day VARCHAR(20),
ADD COLUMN IF NOT EXISTS salesforce_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_schedules_salesforce_day
ON outlet_visit_schedules(salesforce_code, day);

-- ==========================================
-- END MIGRATION 000
-- ==========================================
