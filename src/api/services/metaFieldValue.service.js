const model = require("../models/metaFieldValue.model");
const { chunk } = require('lodash');

class service {
  async getExistedRecords(payload, trx) {
    const { serviceIds } = payload;
    const data = await model.query(trx).select('id', 'stringValue').whereIn('stringValue', serviceIds)
      .whereExists(
        model.relatedQuery('metaFieldName').where('entityType', 'ORDER').andWhere('name', 'Service ID')
      )
      .whereExists(
        model.relatedQuery('order').whereNull('activeUntil')
      )
      .withGraphFetched('[order(filterActive).[orderLine(filterActive).[item(filterActive)]]]');
    return data;
  }
  async upsertGraphPriceUpdateRelateNoDeleteNoInsert(payload, trx) {
    console.log('upsertGraphPriceUpdateRelateNoDeleteNoInsert started')
    const data = await model.query(trx).upsertGraphAndFetch(payload, { relate: true, noDelete: true, noInsert: true, update: true });
    console.log('upsertGraphPriceUpdateRelateNoDeleteNoInsert completed successfully');
    return data;
  }

  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async deleteMetaFieldValueById(metaFieldValueId, trx) {
    const batchSize = 1000;
    const idChunks = chunk(metaFieldValueId, batchSize);
    console.log('deleteMetaFieldValueById started');
    let count = 0;
    for (const batch of idChunks) {
      await model.query(trx).delete().whereIn('id', batch);
      console.log('batch', ++count);
    }
    console.log('deleteMetaFieldValueById completed successfully');
    return count;
  }
}
module.exports = new service();
