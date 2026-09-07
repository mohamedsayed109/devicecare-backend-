const express = require("express");
const cors = require("cors");

const reportsRoute = require("./reports-routes");
const adminRoute = require("./admin-routes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/v1/reports", reportsRoute);
app.use("/api/v1/admin", adminRoute);

// Central error handler — keeps every route's try/catch(next(err)) simple.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

module.exports = app;
