const { ensureTl, getQuarter, getTableClient, getUserFromClientPrincipal } = require("../shared/common");

module.exports = async function (context, req) {
  try {
    const user = getUserFromClientPrincipal(req);
    if (!user) {
      context.res = { status: 401, body: "Unauthorized" };
      return;
    }

    if (!ensureTl(user.userDetails)) {
      context.res = { status: 403, body: "Only TL can calibrate submissions." };
      return;
    }

    const { rowKey, tlCalibratedLevel, tlCalibratedTrack, tlComment } = req.body || {};
    if (!rowKey || !tlCalibratedLevel || !tlCalibratedTrack || !tlComment) {
      context.res = { status: 400, body: "Missing required calibration fields." };
      return;
    }

    const client = getTableClient();
    const quarter = getQuarter();
    const entity = await client.getEntity(quarter, rowKey);

    entity.tlCalibratedLevel = tlCalibratedLevel;
    entity.tlCalibratedTrack = tlCalibratedTrack;
    entity.tlComment = tlComment;
    entity.tlUpdatedBy = user.userDetails;
    entity.tlUpdatedAt = new Date().toISOString();

    await client.updateEntity(entity, "Replace");

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { ok: true }
    };
  } catch (error) {
    context.res = { status: 500, body: error.message || "Server error" };
  }
};