const model = require("../models/itemTypeMap.model");

class service {
  async deleteItemTypeMapByItemTypeId(itemTypeId, trx) {
    console.log('deleteItemTypeMapByItemTypeId started');
    const data = await model.query(trx).delete().whereIn('typeId', itemTypeId);
    console.log('deleteItemTypeMapByItemTypeId completed successfully');
    return data;
  }
}
module.exports = new service();
