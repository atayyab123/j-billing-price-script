const model = require("../models/metaFieldGroup.model");

class service {
  async getChannelPartnerGroup(trx) {
    const data = await model.query(trx)
      .where('name', 'Channel Partner')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('discriminator', 'ACCOUNT_TYPE')
      .andWhere('entityId', 20)
      .andWhere('accountTypeId', 301)
      .first();
    return data;
  }

  async getCustomerGroup(trx) {
    const data = await model.query(trx)
      .where('name', 'Customer')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('discriminator', 'ACCOUNT_TYPE')
      .andWhere('entityId', 20)
      .andWhere('accountTypeId', 302)
      .first();
    return data;
  }

  async getSiteGroup(trx) {
    const data = await model.query(trx)
      .where('name', 'Site')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('discriminator', 'ACCOUNT_TYPE')
      .andWhere('entityId', 20)
      .andWhere('accountTypeId', 303)
      .first();
    return data;
  }

  async getSiteServiceSetGroup(trx) {
    const data = await model.query(trx)
      .where('name', 'Site Service Set')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('discriminator', 'ACCOUNT_TYPE')
      .andWhere('entityId', 20)
      .andWhere('accountTypeId', 304)
      .first();
    return data;
  }
}
module.exports = new service();
