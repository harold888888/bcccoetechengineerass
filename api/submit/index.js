const { ensureParticipant, getQuarter, getTableClient, getUserFromClientPrincipal, normalizeEmail } = require("../shared/common");

module.exports = async function (context, req) {
  try {
    const principal = getUserFromClientPrincipal(req);
    const workEmail = normalizeEmail((req.body || {}).workEmail);
    const user = principal || {
      userId: workEmail,
      userDetails: workEmail,
      roles: ["anonymous-demo"]
    };

    if (!user.userDetails) {
      context.res = { status: 400, body: "Missing workEmail" };
      return;
    }

    if (!ensureParticipant(user.userDetails)) {
      context.res = { status: 403, body: "Current account is not in the allowed participant list." };
      return;
    }

    const body = req.body || {};
    const requiredFields = ["certLevel", "solutionLevel", "productEvidence", "certIds", "certEvidence", "solutionEvidence", "weightedScore", "suggestedLevel"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        context.res = { status: 400, body: `Missing field: ${field}` };
        return;
      }
    }

    if (!Array.isArray(body.products) || body.products.length === 0) {
      context.res = { status: 400, body: "Missing products" };
      return;
    }

    const now = new Date().toISOString();
    const quarter = getQuarter();
    const client = getTableClient();
    await client.createTable();

    await client.upsertEntity({
      partitionKey: quarter,
      rowKey: user.userId,
      userId: user.userId,
      userEmail: user.userDetails,
      products: JSON.stringify(body.products),
      productScore: Number(body.productScore || 0),
      productEvidence: body.productEvidence,
      certLevel: body.certLevel,
      certIds: body.certIds,
      certEvidence: body.certEvidence,
      solutionLevel: body.solutionLevel,
      solutionEvidence: body.solutionEvidence,
      weightedScore: Number(body.weightedScore),
      suggestedLevel: body.suggestedLevel,
      updatedAt: now,
      tlCalibratedLevel: body.tlCalibratedLevel || "",
      tlComment: body.tlComment || ""
    }, "Replace");

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        ok: true,
        rowKey: user.userId,
        suggestedLevel: body.suggestedLevel
      }
    };
  } catch (error) {
    context.res = { status: 500, body: error.message || "Server error" };
  }
};
