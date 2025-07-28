const model = require("../models/jbillingTable.model");

class service {
  async itemTableId(trx) {
    const data = await model.query(trx).where('name', 'item').first();
    return data;
  }
}
module.exports = new service();
