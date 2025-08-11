const model = require("../models/orderMetaFieldMap.model");

class service {
  async deleteOrderMetaFieldMapByOrderId(orderId, trx) {
    console.log('deleteOrderMetaFieldMapByOrderId started');
    const data = await model.query(trx).delete().whereIn('orderId', orderId);
    console.log('deleteOrderMetaFieldMapByOrderId completed successfully');
    return data;
  }
}
module.exports = new service();