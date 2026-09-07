// Local development entry point only. On Vercel, api/index.js is used
// instead — Vercel runs the Express app as a serverless function and
// doesn't need a listening port.
const app = require("./app");
const db = require("./db");

const PORT = process.env.PORT || 3000;

db.initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`DeviceCare backend listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database schema:", err);
    process.exit(1);
  });
