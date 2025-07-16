const model = require("../models/metaFieldValue.model");

class service {
  async getExistedRecords(payload, trx) {
    const { serviceIds } = payload;
    const data = await model.query(trx).whereIn('stringValue', serviceIds)
      .whereExists(
        model.relatedQuery('metaFieldName').where('entityType', 'ORDER').andWhere('name', 'Service ID')
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
}
module.exports = new service();
