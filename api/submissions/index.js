const { ensureTl, getQuarter, getTableClient, getUserFromClientPrincipal, normalizeEmail } = require("../shared/common");

function mapEntity(entity) {
  return {
    ...entity,
    products: entity.products ? JSON.parse(entity.products) : []
  };
}

module.exports = async function (context, req) {
  try {
    const user = getUserFromClientPrincipal(req);
    const emailQuery = String(req.query.email || "").trim().toLowerCase();
    const tlEmail = normalizeEmail(req.query.tlEmail || "");
    if (!user) {
      if (!emailQuery) {
        context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: { record: null } };
        return;
      }
    }

    const client = getTableClient();
    const quarter = getQuarter();
    const adminView = String(req.query.all || "").toLowerCase() === "true";

    if (adminView) {
      const adminIdentity = user ? user.userDetails : tlEmail;
      if (!ensureTl(adminIdentity)) {
        context.res = { status: 403, body: "Only TL can access all submissions." };
        return;
      }

      const records = [];
      const entities = client.listEntities({ queryOptions: { filter: `PartitionKey eq '${quarter}'` } });
      for await (const entity of entities) {
        records.push(mapEntity(entity));
      }

      records.sort((left, right) => Number(right.weightedScore) - Number(left.weightedScore));
      context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: { records } };
      return;
    }

    try {
      const record = await client.getEntity(quarter, user ? user.userId : emailQuery);
      context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: { record: mapEntity(record) } };
    } catch (error) {
      if (error.statusCode === 404) {
        context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: { record: null } };
        return;
      }
      throw error;
    }
  } catch (error) {
    context.res = { status: 500, body: error.message || "Server error" };
  }
};