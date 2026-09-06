const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

async function initSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'); // for gen_random_uuid()
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
}

async function createCompany(name) {
  const { rows } = await pool.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id, name, created_at AS \"createdAt\"",
    [name]
  );
  return rows[0];
}

async function listCompanies() {
  const { rows } = await pool.query('SELECT id, name, created_at AS "createdAt" FROM companies ORDER BY created_at');
  return rows;
}

async function getCompany(id) {
  const { rows } = await pool.query("SELECT id, name FROM companies WHERE id = $1", [id]);
  return rows[0] || null;
}

async function createMachine(companyId, name, apiKey) {
  const { rows } = await pool.query(
    `INSERT INTO machines (company_id, name, api_key)
     VALUES ($1, $2, $3)
     RETURNING id, company_id AS "companyId", name, api_key AS "apiKey", created_at AS "createdAt", last_seen_at AS "lastSeenAt"`,
    [companyId, name, apiKey]
  );
  return rows[0];
}

async function findMachineByApiKey(apiKey) {
  const { rows } = await pool.query("SELECT id, company_id AS \"companyId\" FROM machines WHERE api_key = $1", [apiKey]);
  return rows[0] || null;
}

async function touchMachine(id, when) {
  await pool.query("UPDATE machines SET last_seen_at = $2 WHERE id = $1", [id, when]);
}

async function listMachinesWithLatestReport(companyId) {
  const { rows } = await pool.query(
    `SELECT
       m.id, m.name, m.last_seen_at AS "lastSeenAt",
       r.id AS "reportId", r.received_at AS "receivedAt", r."timestamp", r.run_by AS "runBy",
       r.run_mode AS "runMode", r.duration_seconds AS "durationSeconds",
       r.cpu_load_percent AS "cpuLoadPercent", r.disk_free_percent AS "diskFreePercent",
       r.storage, r.actions, r.errors, r.status,
       (SELECT count(*) FROM reports r2 WHERE r2.machine_id = m.id) AS "reportCount"
     FROM machines m
     LEFT JOIN LATERAL (
       SELECT * FROM reports WHERE machine_id = m.id ORDER BY received_at DESC LIMIT 1
     ) r ON true
     WHERE m.company_id = $1
     ORDER BY m.name`,
    [companyId]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    lastSeenAt: row.lastSeenAt,
    status: row.reportId ? row.status : "never_reported",
    reportCount: Number(row.reportCount),
    latestReport: row.reportId
      ? {
          id: row.reportId,
          receivedAt: row.receivedAt,
          timestamp: row.timestamp,
          runBy: row.runBy,
          runMode: row.runMode,
          durationSeconds: row.durationSeconds,
          cpuLoadPercent: row.cpuLoadPercent,
          diskFreePercent: row.diskFreePercent,
          storage: row.storage,
          actions: row.actions,
          errors: row.errors,
          status: row.status,
        }
      : null,
  }));
}

async function listReportsForMachine(machineId) {
  const { rows } = await pool.query(
    `SELECT id, received_at AS "receivedAt", "timestamp", run_by AS "runBy", run_mode AS "runMode",
            duration_seconds AS "durationSeconds", cpu_load_percent AS "cpuLoadPercent",
            disk_free_percent AS "diskFreePercent", storage, actions, errors, status
     FROM reports WHERE machine_id = $1 ORDER BY received_at DESC`,
    [machineId]
  );
  return rows;
}

async function insertReport(r) {
  const { rows } = await pool.query(
    `INSERT INTO reports
       (machine_id, "timestamp", run_by, run_mode, duration_seconds, cpu_load_percent,
        disk_free_percent, storage, actions, errors, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      r.machineId, r.timestamp, r.runBy, r.runMode, r.durationSeconds, r.cpuLoadPercent,
      r.diskFreePercent, JSON.stringify(r.storage), JSON.stringify(r.actions), JSON.stringify(r.errors), r.status,
    ]
  );
  return rows[0].id;
}

module.exports = {
  pool,
  initSchema,
  createCompany,
  listCompanies,
  getCompany,
  createMachine,
  findMachineByApiKey,
  touchMachine,
  listMachinesWithLatestReport,
  listReportsForMachine,
  insertReport,
};
