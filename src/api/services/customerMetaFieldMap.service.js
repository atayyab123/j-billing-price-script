const model = require("../models/customerMetaFieldMap.model");

class service {
  async deleteCustomerMetaFieldMapByCustomerId(customerId, trx) {
    console.log('deleteCustomerMetaFieldMapByCustomerId started');
    const data = await model.query(trx).delete().whereIn('customerId', customerId);
    console.log('deleteCustomerMetaFieldMapByCustomerId completed successfully');
    return data;
  }
}
module.exports = new service();