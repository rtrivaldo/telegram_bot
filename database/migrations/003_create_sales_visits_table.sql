CREATE TABLE IF NOT EXISTS sales_visits (
    id BIGSERIAL PRIMARY KEY,

    -- Relasi sales dan outlet
    user_id BIGINT NOT NULL
        REFERENCES users(id),
    outlet_id BIGINT NOT NULL
        REFERENCES outlets(id),

    -- Periode kunjungan
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_week SMALLINT NOT NULL
        CHECK (period_week BETWEEN 1 AND 5),

    -- Saldo Digipos
    digipos_balance NUMERIC(15, 2) NOT NULL DEFAULT 0
        CHECK (digipos_balance >= 0),

    -- Perdana SA
    perdana_sa_stock INTEGER NOT NULL DEFAULT 0
        CHECK (perdana_sa_stock >= 0),
    perdana_sa_selling INTEGER NOT NULL DEFAULT 0
        CHECK (perdana_sa_selling >= 0),
    perdana_sa_sellout INTEGER NOT NULL DEFAULT 0
        CHECK (perdana_sa_sellout >= 0),

    -- VF Data
    vf_data_stock INTEGER NOT NULL DEFAULT 0
        CHECK (vf_data_stock >= 0),
    vf_data_selling INTEGER NOT NULL DEFAULT 0
        CHECK (vf_data_selling >= 0),
    vf_data_sellout INTEGER NOT NULL DEFAULT 0
        CHECK (vf_data_sellout >= 0),

    -- VF Voice
    vf_voice_stock INTEGER NOT NULL DEFAULT 0
        CHECK (vf_voice_stock >= 0),
    vf_voice_selling INTEGER NOT NULL DEFAULT 0
        CHECK (vf_voice_selling >= 0),
    vf_voice_sellout INTEGER NOT NULL DEFAULT 0
        CHECK (vf_voice_sellout >= 0),

    -- Status outlet aktif
    active_cvm BOOLEAN NOT NULL,
    active_voice BOOLEAN NOT NULL,
    active_digital BOOLEAN NOT NULL,

    -- Total belanja
    total_purchase NUMERIC(15, 2) NOT NULL DEFAULT 0
        CHECK (total_purchase >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk pencarian laporan
CREATE INDEX IF NOT EXISTS idx_sales_visits_user
    ON sales_visits(user_id);

CREATE INDEX IF NOT EXISTS idx_sales_visits_outlet
    ON sales_visits(outlet_id);

CREATE INDEX IF NOT EXISTS idx_sales_visits_date
    ON sales_visits(visit_date);

CREATE INDEX IF NOT EXISTS idx_sales_visits_period
    ON sales_visits(visit_date, period_week);