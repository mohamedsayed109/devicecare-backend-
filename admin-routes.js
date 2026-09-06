const express = require("express");
const { randomUUID } = require("crypto");
const db = require("./db");
const { requireAdminKey } = require("./auth");

const router = express.Router();
router.use(requireAdminKey);

router.post("/companies", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const company = await db.createCompany(name);
    res.status(201).json(company);
  } catch (err) { next(err); }
});

router.get("/companies", async (req, res, next) => {
  try {
    res.json(await db.listCompanies());
  } catch (err) { next(err); }
});

router.post("/companies/:companyId/machines", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const company = await db.getCompany(companyId);
    if (!company) return res.status(404).json({ error: "company not found" });

    const apiKey = `dc_${randomUUID().replace(/-/g, "")}`;
    const machine = await db.createMachine(companyId, name, apiKey);
    res.status(201).json(machine);
  } catch (err) { next(err); }
});

router.get("/companies/:companyId/machines", async (req, res, next) => {
  try {
    res.json(await db.listMachinesWithLatestReport(req.params.companyId));
  } catch (err) { next(err); }
});

router.get("/machines/:machineId/reports", async (req, res, next) => {
  try {
    res.json(await db.listReportsForMachine(req.params.machineId));
  } catch (err) { next(err); }
});

module.exports = router;
