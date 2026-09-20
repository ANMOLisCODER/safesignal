import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

dotenv.config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.LOCATION_HASH_SECRET;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from .env.local",
  );
}

if (!secret) {
  throw new Error(
    "LOCATION_HASH_SECRET is missing from .env.local",
  );
}

const sql = neon(databaseUrl);

const locationHash =
  "v1_pattern_test_location";

function reporterHash(sessionId) {
  return crypto
    .createHmac("sha256", secret)
    .update(`reporter:v1:${sessionId}`)
    .digest("hex")
    .slice(0, 32);
}

const now = Date.now();

const reports = [
  {
    session: "pattern-user-a",
    hoursAgo: 12,
    category: "harassment",
  },
  {
    session: "pattern-user-b",
    hoursAgo: 30,
    category: "harassment",
  },
  {
    session: "pattern-user-c",
    hoursAgo: 54,
    category: "harassment",
  },
];

for (const report of reports) {
  await sql`
    INSERT INTO reports (
      category,
      description,
      location_hash,
      occurred_at,
      reporter_session_hash
    )
    VALUES (
      ${report.category},
      ${"Pattern engine test"},
      ${locationHash},
      ${new Date(
        now - report.hoursAgo * 60 * 60 * 1000,
      ).toISOString()},
      ${reporterHash(report.session)}
    )
  `;
}

console.log(
  "Inserted 3 diverse pattern-test reports.",
);