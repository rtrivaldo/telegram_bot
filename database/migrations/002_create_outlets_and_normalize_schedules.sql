BEGIN;

-- 1. Create master outlets table
CREATE TABLE outlets (
    id BIGSERIAL PRIMARY KEY,
    outlet_id VARCHAR(50) NOT NULL UNIQUE,
    no_rs VARCHAR(50) NOT NULL,
    outlet_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrate existing outlet data
INSERT INTO outlets (
    outlet_id,
    no_rs,
    outlet_name
)
SELECT DISTINCT
    outlet_id,
    no_rs,
    outlet_name
FROM outlet_visit_schedules;

-- 3. Add new relationship columns
ALTER TABLE outlet_visit_schedules
ADD COLUMN user_id BIGINT,
ADD COLUMN outlet_ref_id BIGINT;

-- 4. Map existing salesforce_code to users.id
UPDATE outlet_visit_schedules AS schedules
SET user_id = users.id
FROM users
WHERE users.salesforce_code = schedules.salesforce_code;

-- 5. Map existing outlet_id to outlets.id
UPDATE outlet_visit_schedules AS schedules
SET outlet_ref_id = outlets.id
FROM outlets
WHERE outlets.outlet_id = schedules.outlet_id;

-- 6. Ensure all records have valid relationships
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM outlet_visit_schedules
        WHERE user_id IS NULL OR outlet_ref_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration aborted: some schedules have missing relationships';
    END IF;
END $$;

-- 7. Make relationship columns mandatory
ALTER TABLE outlet_visit_schedules
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN outlet_ref_id SET NOT NULL;

-- 8. Add foreign keys
ALTER TABLE outlet_visit_schedules
ADD CONSTRAINT fk_schedule_user
FOREIGN KEY (user_id) REFERENCES users(id),
ADD CONSTRAINT fk_schedule_outlet
FOREIGN KEY (outlet_ref_id) REFERENCES outlets(id);

-- 9. Remove redundant columns
ALTER TABLE outlet_visit_schedules
DROP COLUMN outlet_id,
DROP COLUMN no_rs,
DROP COLUMN outlet_name,
DROP COLUMN salesforce_code;

-- 10. Rename outlet reference column
ALTER TABLE outlet_visit_schedules
RENAME COLUMN outlet_ref_id TO outlet_id;

-- 11. Add indexes
CREATE INDEX idx_schedule_user_day
ON outlet_visit_schedules(user_id, day);

CREATE INDEX idx_schedule_outlet
ON outlet_visit_schedules(outlet_id);

COMMIT;