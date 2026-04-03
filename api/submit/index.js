const { ensureParticipant, getQuarter, getTableClient, getUserFromClientPrincipal } = require("../shared/common");

module.exports = async function (context, req) {
  try {
    const user = getUserFromClientPrincipal(req);
    if (!user) {
      context.res = { status: 401, body: "Unauthorized" };
      return;
    }

    if (!ensureParticipant(user.userDetails)) {
      context.res = { status: 403, body: "Current account is not in the allowed participant list." };
      return;
    }

    const body = req.body || {};
    const requiredFields = ["productLevel", "certLevel", "solutionLevel", "productEvidence", "certIds", "certEvidence", "solutionEvidence", "weightedScore", "suggestedLevel", "suggestedTrack"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        context.res = { status: 400, body: `Missing field: ${field}` };
        return;
      }
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
      productLevel: body.productLevel,
      productDirection: body.productDirection || "",
      productEvidence: body.productEvidence,
      certLevel: body.certLevel,
      certDirection: body.certDirection || "",
      certIds: body.certIds,
      certEvidence: body.certEvidence,
      solutionLevel: body.solutionLevel,
      solutionDirection: body.solutionDirection || "",
      solutionEvidence: body.solutionEvidence,
      weightedScore: Number(body.weightedScore),
      suggestedLevel: body.suggestedLevel,
      suggestedTrack: body.suggestedTrack,
      updatedAt: now,
      tlCalibratedLevel: body.tlCalibratedLevel || "",
      tlCalibratedTrack: body.tlCalibratedTrack || "",
      tlComment: body.tlComment || ""
    }, "Replace");

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        ok: true,
        rowKey: user.userId,
        suggestedLevel: body.suggestedLevel,
        suggestedTrack: body.suggestedTrack
      }
    };
  } catch (error) {
    context.res = { status: 500, body: error.message || "Server error" };
  }
};
