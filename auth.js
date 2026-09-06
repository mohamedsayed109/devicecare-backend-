const db = require("./db");

async function requireMachineKey(req, res, next) {
  const key = req.header("X-Api-Key");
  if (!key) {
    return res.status(401).json({ error: "missing X-Api-Key header" });
  }
  try {
    const machine = await db.findMachineByApiKey(key);
    if (!machine) {
      return res.status(401).json({ error: "invalid API key" });
    }
    req.machine = machine;
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdminKey(req, res, next) {
  const key = req.header("X-Admin-Key");
  if (!key || key !== (process.env.ADMIN_KEY || "dev-admin-key")) {
    return res.status(401).json({ error: "missing or invalid X-Admin-Key header" });
  }
  next();
}

module.exports = { requireMachineKey, requireAdminKey };
