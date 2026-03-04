/**
 * Local development server for StoryTeller Node API.
 *
 * Runs the Express app on a local port.
 * Usage: node api/dev-server.js
 */

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import app from "./server.js";

/**
 * Load environment variables from the project .env file for local development.
 *
 * Only sets variables that are not already defined in process.env,
 * allowing shell-provided values to take precedence.
 */
function loadLocalEnvFile() {
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  const envPath = path.resolve(dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envLines = envContent.split(/\r?\n/);

  for (const rawLine of envLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.substring(0, separatorIndex).trim();
    const value = line.substring(separatorIndex + 1).trim();

    // Only set if not already in process.env
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile();

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`\n🚀 StoryTeller API running at http://localhost:${port}`);
  console.log(`   Health check: http://localhost:${port}/api/health`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
