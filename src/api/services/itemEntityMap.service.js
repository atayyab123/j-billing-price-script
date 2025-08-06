const model = require("../models/itemEntityMap.model");

class service {
  async deleteItemEntityMapByItemId(itemId, trx) {
    console.log('deleteItemEntityMapByItemId started');
    const data = await model.query(trx).delete().whereIn('itemId', itemId).andWhere('entityId', 20);
    console.log('deleteItemEntityMapByItemId completed successfully');
    return data;
  }
}
module.exports = new service();
