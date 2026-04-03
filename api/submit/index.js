const { TableClient } = require("@azure/data-tables");

function getUserFromClientPrincipal(req) {
  const header = req.headers["x-ms-client-principal"];
  if (!header) return null;
  const decoded = Buffer.from(header, "base64").toString("utf8");
  const obj = JSON.parse(decoded);
  return {
    userId: obj.userId,
    userDetails: obj.userDetails || "unknown",
    roles: obj.userRoles || []
  };
}

module.exports = async function (context, req) {
  try {
    const user = getUserFromClientPrincipal(req);
    if (!user) {
      context.res = { status: 401, body: "Unauthorized" };
      return;
    }

    const conn = process.env.STORAGE_CONNECTION_STRING;
    const tableName = process.env.TABLE_NAME || "assessments";
    if (!conn) {
      context.res = { status: 500, body: "Missing storage connection" };
      return;
    }

    const body = req.body || {};
    const required = ["productLevel", "certLevel", "solutionLevel", "weightedScore", "suggestedLevel", "suggestedTrack"];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === "") {
        context.res = { status: 400, body: `Missing field: ${f}` };
        return;
      }
    }

    const client = TableClient.fromConnectionString(conn, tableName);
    await client.createTable();

    const now = new Date();
    const quarter = "2026Q2";
    const rowKey = `${now.getTime()}`;

    const entity = {
      partitionKey: quarter,
      rowKey,
      userId: user.userId,
      userEmail: user.userDetails,
      productLevel: body.productLevel,
      productDirection: body.productDirection || "",
      productEvidence: body.productEvidence || "",
      certLevel: body.certLevel,
      certDirection: body.certDirection || "",
      certIds: body.certIds || "",
      certEvidence: body.certEvidence || "",
      solutionLevel: body.solutionLevel,
      solutionDirection: body.solutionDirection || "",
      solutionEvidence: body.solutionEvidence || "",
      weightedScore: Number(body.weightedScore),
      suggestedLevel: body.suggestedLevel,
      suggestedTrack: body.suggestedTrack,
      createdAt: now.toISOString()
    };

    await client.createEntity(entity);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { ok: true, rowKey, suggestedLevel: body.suggestedLevel, suggestedTrack: body.suggestedTrack }
    };
  } catch (e) {
    context.res = { status: 500, body: e.message || "Server error" };
  }
};
