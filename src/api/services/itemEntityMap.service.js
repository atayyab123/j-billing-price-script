const model = require("../models/itemEntityMap.model");

class service {
  async deleteItemEntityMapByItemId(itemId, trx) {
    console.log('deleteItemEntityMapByItemId started');
    const data = await model.query(trx).delete().whereIn('itemId', itemId).andWhere('entityId', 20);
    console.log('deleteItemEntityMapByItemId completed successfully');
    return data;
  }

  async upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate started')
    const data = await model.query(trx).upsertGraphAndFetch(payload, { insertMissing: true, noDelete: true, noUpdate: true, noRelate: true });
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate completed successfully');
    return data;
  }
}
module.exports = new service();
