import { app } from "./app.js";
import { getEnv } from "./config/env.js";

const { port } = getEnv();

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`city-api listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
