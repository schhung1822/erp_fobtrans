import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

export function getDbPool() {
  if (!globalThis.mysqlPool) {
    globalThis.mysqlPool = mysql.createPool({
      uri: getDatabaseUrl(),
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
      timezone: "Z",
    });
  }

  return globalThis.mysqlPool;
}
