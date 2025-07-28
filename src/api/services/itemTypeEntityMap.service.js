const model = require("../models/itemTypeEntityMap.model");

class service {
  async upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate started')
    const data = await model.query(trx).upsertGraphAndFetch(payload, { insertMissing: true, noDelete: true, noUpdate: true, noRelate: true });
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate completed successfully');
    return data;
  }
}
module.exports = new service();
