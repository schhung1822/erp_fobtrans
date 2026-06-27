import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    if (DB_HOST && DB_USER && DB_NAME) {
      const port = DB_PORT || "3306";
      return `mysql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD || "")}@${DB_HOST}:${port}/${DB_NAME}`;
    }

    throw new Error("DATABASE_URL or DB_HOST/DB_USER/DB_NAME is not configured.");
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
