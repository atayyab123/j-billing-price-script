const model = require("../models/itemType.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async deleteItemTypeById(itemTypeId, trx) {
    console.log('deleteItemTypeById started');
    const data = await model.query(trx).delete().whereIn('id', itemTypeId);
    console.log('deleteItemTypeById completed successfully');
    return data;
  }
}
module.exports = new service();
