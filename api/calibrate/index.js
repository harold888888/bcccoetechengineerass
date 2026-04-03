const { ensureTl, getQuarter, getTableClient, getUserFromClientPrincipal, normalizeEmail } = require("../shared/common");

module.exports = async function (context, req) {
  try {
    const user = getUserFromClientPrincipal(req);
    const tlEmail = normalizeEmail((req.body || {}).tlEmail);
    const effectiveTl = user ? user.userDetails : tlEmail;

    if (!ensureTl(effectiveTl)) {
      context.res = { status: 403, body: "Only TL can calibrate submissions." };
      return;
    }

    const { rowKey, tlCalibratedLevel, tlComment } = req.body || {};
    if (!rowKey || !tlCalibratedLevel || !tlComment) {
      context.res = { status: 400, body: "Missing required calibration fields." };
      return;
    }

    const client = getTableClient();
    const quarter = getQuarter();
    const entity = await client.getEntity(quarter, rowKey);

    entity.tlCalibratedLevel = tlCalibratedLevel;
    entity.tlComment = tlComment;
    entity.tlUpdatedBy = effectiveTl;
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