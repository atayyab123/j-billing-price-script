const model = require("../models/baseUser.model");

class service {
  async maxId(trx) {
    const data = await model.query(trx).max('id as maxId').first();
    return data?.maxId || 0;
  }

  async getUserHierarchy(payload, trx) {
    const data = await model.query(trx).whereIn('userName', payload).where('deleted', 0)
      .withGraphFetched('[customer.[child.[child.[user(filterActive)], user(filterActive)], user(filterActive)]]');
    return data;
  }
}
module.exports = new service();
