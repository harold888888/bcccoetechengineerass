const { TableClient } = require("@azure/data-tables");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getUserFromClientPrincipal(req) {
  const header = req.headers["x-ms-client-principal"];
  if (!header) {
    return null;
  }

  const decoded = Buffer.from(header, "base64").toString("utf8");
  const principal = JSON.parse(decoded);
  return {
    userId: principal.userId,
    userDetails: normalizeEmail(principal.userDetails || "unknown"),
    roles: principal.userRoles || []
  };
}

function parseEnvList(name, fallback) {
  return String(process.env[name] || fallback)
    .split(/[;,\n]/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function getQuarter() {
  return process.env.CURRENT_QUARTER || "2026Q2";
}

function getTableClient() {
  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("Missing storage connection");
  }

  return TableClient.fromConnectionString(connectionString, process.env.TABLE_NAME || "assessments");
}

function ensureParticipant(email) {
  const allowed = parseEnvList(
    "ALLOWED_EMAILS",
    "harold.luo@bluecloudatlas.cn;kayn@bluecloudatlas.cn;xiaoen.zheng@bluecloudatlas.cn;gary.wang@bluecloudatlas.cn;chenkeyu@bluecloudatlas.cn;fenglianran@bluecloudatlas.cn"
  );
  return allowed.includes(normalizeEmail(email));
}

function ensureTl(email) {
  const admins = parseEnvList("TL_EMAILS", "harold.luo@bluecloudatlas.cn");
  return admins.includes(normalizeEmail(email));
}

module.exports = {
  ensureParticipant,
  ensureTl,
  getQuarter,
  getTableClient,
  getUserFromClientPrincipal,
  normalizeEmail
};