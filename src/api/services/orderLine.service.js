const model = require("../models/orderLine.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async deleteOrderLineById(orderLineId, trx) {
    console.log('deleteOrderLineById started');
    const data = await model.query(trx).delete().whereIn('id', orderLineId);
    console.log('deleteOrderLineById completed successfully');
    return data;
  }
}
module.exports = new service();