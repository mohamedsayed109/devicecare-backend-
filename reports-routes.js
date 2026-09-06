const express = require("express");
const db = require("./db");
const { requireMachineKey } = require("./auth");

const router = express.Router();

function deriveStatus(errors, diskFreePercent) {
  if (typeof diskFreePercent === "number" && diskFreePercent < 5) return "critical";
  if (!errors || errors.length === 0) return "ok";
  const text = errors.join(" ").toLowerCase();
  if (text.includes("critical") || text.includes("corruption")) return "critical";
  return "warning";
}

router.post("/", requireMachineKey, async (req, res, next) => {
  try {
    const {
      timestamp, runBy, runMode, durationSeconds,
      cpuLoadPercent, diskFreePercent, storage, actions, errors,
    } = req.body;

    if (!Array.isArray(actions)) {
      return res.status(400).json({ error: "actions must be an array" });
    }

    const status = deriveStatus(errors, diskFreePercent);
    const now = new Date();

    const reportId = await db.insertReport({
      machineId: req.machine.id,
      timestamp: timestamp || now.toISOString(),
      runBy: runBy || null,
      runMode: runMode || null,
      durationSeconds: durationSeconds ?? null,
      cpuLoadPercent: cpuLoadPercent ?? null,
      diskFreePercent: diskFreePercent ?? null,
      storage: storage || [],
      actions,
      errors: errors || [],
      status,
    });

    await db.touchMachine(req.machine.id, now);

    res.status(201).json({ id: reportId, status });
  } catch (err) { next(err); }
});

module.exports = router;
