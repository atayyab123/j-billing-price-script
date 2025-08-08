const model = require("../models/itemType.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async deleteItemTypeById(itemTypeId, trx) {
    console.log('deleteItemTypeById started');
    const data = await model.query(trx).delete().whereIn('id', itemTypeId);
    console.log('deleteItemTypeById completed successfully');
    return data;
  }

  async getItemTypes(payload, trx) {
    const data = await model.query(trx).whereIn('description', payload).andWhere('entityId', 20).select('id', 'description');
    return data;
  }

  async upsertGraphInsertMissingNoDeleteRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteRelate started')
    const data = await model.query(trx).upsertGraph(payload, { insertMissing: true, noDelete: true, relate: true });
    console.log('upsertGraphInsertMissingNoDeleteRelate completed successfully');
    return data;
  }
}
module.exports = new service();
