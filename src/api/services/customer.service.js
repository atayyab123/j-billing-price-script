const model = require("../models/customer.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async getServiceHierarchy(payload, trx) {
    const data = await model.query(trx).whereIn('id', payload).select('id', 'isParent')
      .withGraphFetched('[child.[user(filterActive).[order(filterActive).[metaFieldValue, orderLine(filterActive)], userRoleMap], metaFieldValue.[metafieldGroupMetaFieldMap]]]');
    return data;
  }

  async upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(payload, trx) {
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate started')
    const data = await model.query(trx).upsertGraph(payload, { insertMissing: true, noDelete: true, noUpdate: true, noRelate: true });
    console.log('upsertGraphInsertMissingNoDeleteNoUpdateNoRelate completed successfully');
    return data;
  }

  async upsertGraphInsertMissingNoDelete(payload, trx) {
    console.log('upsertGraphInsertMissingNoDelete started')
    const data = await model.query(trx).upsertGraph(payload, { insertMissing: true, noDelete: true });
    console.log('upsertGraphInsertMissingNoDelete completed successfully');
    return data;
  }

  async patchIsParentBySiteId(siteId, trx) {
    console.log('patchIsParentBySiteId started');
    const data = model.query(trx).patch({ isParent: 0 }).whereIn('id', siteId);
    console.log('patchIsParentBySiteId completed successfully');
  }

  async deleteServiceById(serviceId, trx) {
    console.log('deleteServiceById started');
    const data = await model.query(trx).delete().whereIn('id', serviceId);
    console.log('deleteServiceById completed successfully');
    return data;
  }
}
module.exports = new service();
