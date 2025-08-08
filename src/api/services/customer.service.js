const model = require("../models/customer.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate started')
    const data = await model.query(trx).upsertGraph(payload, { insertMissing: true, noDelete: true, noUpdate: true, noRelate: true });
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate completed successfully');
    return data;
  }

  async upsertGraphInsertMissingNoDelete(payload, trx) {
    console.log('upsertGraphInsertMissingNoDelete started')
    const data = await model.query(trx).upsertGraph(payload, { insertMissing: true, noDelete: true });
    console.log('upsertGraphInsertMissingNoDelete completed successfully');
    return data;
  }
}
module.exports = new service();
