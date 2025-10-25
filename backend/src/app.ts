// Minimal Express app scaffold so `tsc` has something to build.
// Flesh out routes/controllers later.
import express from "express";

const app = express();
app.use(express.json());

// health for local smoke
app.get("/health", (_req, res) => res.json({ ok: true }));

export default app;