const model = require("../models/metafieldGroupMetaFieldMap.model");

class service {
  async deleteMetafieldGroupMetaFieldMapByMetaFieldValueId(metaFieldValueId, trx) {
    console.log('deleteMetafieldGroupMetaFieldMapByMetaFieldValueId started');
    const data = await model.query(trx).delete().whereIn('metaFieldValueId', metaFieldValueId);
    console.log('deleteMetafieldGroupMetaFieldMapByMetaFieldValueId completed successfully');
    return data;
  }
}
module.exports = new service();