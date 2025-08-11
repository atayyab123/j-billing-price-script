const model = require("../models/purchaseOrder.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async deleteOrderById(orderId, trx) {
    console.log('deleteOrderById started');
    const data = await model.query(trx).delete().whereIn('id', orderId);
    console.log('deleteOrderById completed successfully');
    return data;
  }
}
module.exports = new service();