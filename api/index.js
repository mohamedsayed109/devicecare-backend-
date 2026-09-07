// Vercel treats any file under /api as a serverless function. Exporting the
// Express app directly works because an Express app is itself a callable
// (req, res) handler - no extra wrapper needed.
//
// Note: schema init (db.initSchema()) is NOT run here on every cold start,
// to avoid re-running CREATE TABLE on every request. Run schema.sql once
// against your Neon database (via Neon's SQL Editor in the browser) before
// the first deploy - see README.md.
module.exports = require("../app");
