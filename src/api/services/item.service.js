const model = require("../models/item.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async getIdAndInternalNumber(trx) {
    const data = await model.query(trx).select('id', 'internalNumber', 'entityId').where('entityId', 20);
    return data;
  }

  async getIdAndInternalNumberByProductCodes(payload, trx) {
    const data = await model.query(trx).select('id', 'internalNumber').whereIn('internalNumber', payload).andWhere('entityId', 20);
    return data;
  }

  async deleteItemById(itemId, trx) {
    console.log('deleteItemById started');
    const data = await model.query(trx).delete().whereIn('id', itemId);
    console.log('deleteItemById completed successfully');
    return data;
  }
}
module.exports = new service();
