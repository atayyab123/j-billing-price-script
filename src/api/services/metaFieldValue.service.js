const model = require("../models/metaFieldValue.model");

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
      .withGraphFetched('[order(filterActive).[orderLine(filterActive).[item(filterActive), orderChange]]]');
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
