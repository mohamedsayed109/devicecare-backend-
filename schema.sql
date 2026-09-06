CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    "timestamp" TIMESTAMPTZ,
    run_by TEXT,
    run_mode TEXT,
    duration_seconds INTEGER,
    cpu_load_percent NUMERIC,
    disk_free_percent NUMERIC,
    storage JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    errors JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_machines_company ON machines(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_machine ON reports(machine_id);
CREATE INDEX IF NOT EXISTS idx_reports_machine_received ON reports(machine_id, received_at DESC);
