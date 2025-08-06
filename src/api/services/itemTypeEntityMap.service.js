const model = require("../models/itemTypeEntityMap.model");

class service {
  async upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate started')
    const data = await model.query(trx).upsertGraphAndFetch(payload, { insertMissing: true, noDelete: true, noUpdate: true, noRelate: true });
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate completed successfully');
    return data;
  }
  
  async upsertGraphInsertMissingNoDeleteRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteRelate started')
    const data = await model.query(trx).upsertGraphAndFetch(payload, { insertMissing: true, noDelete: true, relate: true });
    console.log('upsertGraphInsertMissingNoDeleteRelate completed successfully');
    return data;
  }

  async getProductRelation(payload, trx) {
    const data = await model.query(trx)
      .whereExists(
        model.relatedQuery('itemType').whereIn('description', payload).andWhere('entityId', 20)
      )
      .andWhere('entityId', 20)
      .withGraphFetched('[itemType.[item(filterActive).[itemEntityMap, internationalDescription, metaFieldValue]]]');
    return data;
  }

  async deleteItemTypeEntityMapByItemTypeId(itemTypeId, trx) {
    console.log('deleteItemTypeEntityMapByItemTypeId started');
    const data = await model.query(trx).delete().whereIn('itemTypeId', itemTypeId).andWhere('entityId', 20);
    console.log('deleteItemTypeEntityMapByItemTypeId completed successfully');
    return data;
  }
}
module.exports = new service();
