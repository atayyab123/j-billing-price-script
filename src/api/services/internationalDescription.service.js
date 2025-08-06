const model = require("../models/internationalDescription.model");

class service {
  async deleteInternationalDescriptionByItemId(itemId, trx) {
    console.log('deleteInternationalDescriptionByItemId started');
    const data = await model.query(trx).delete().whereIn('foreignId', itemId).andWhere('tableId', 14);
    console.log('deleteInternationalDescriptionByItemId completed successfully');
    return data;
  }
}
module.exports = new service();
