const model = require("../models/purchaseOrder.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }
}
module.exports = new service();