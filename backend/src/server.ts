import app from "./app";

const PORT = Number(process.env.APP_PORT ?? 3000);
app.listen(PORT, () => {
  // Keep logs minimal; CI may not run this file.
  console.log(`Sophia backend listening on :${PORT}`);
});
