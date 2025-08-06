const model = require("../models/itemMetaFieldMap.model");

class service {
  async deleteItemMetaFieldMapByMetaFieldValueId(metaFieldValueId, trx) {
    console.log('deleteItemMetaFieldMapByMetaFieldValueId started');
    const data = await model.query(trx).delete().whereIn('metaFieldValueId', metaFieldValueId);
    console.log('deleteItemMetaFieldMapByMetaFieldValueId completed successfully');
    return data;
  }
}
module.exports = new service();
