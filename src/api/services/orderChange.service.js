const model = require("../models/orderChange.model");

class service {
  async deleteOrderChangeByOrderLineId(orderLineId, trx) {
    console.log('deleteOrderChangeByOrderLineId started');
    const data = await model.query(trx).delete().whereIn('orderLineId', orderLineId);
    console.log('deleteOrderChangeByOrderLineId completed successfully');
    return data;
  }
}
module.exports = new service();