const model = require("../models/metaFieldName.model");

class service {
  async getGroupCode(trx) {
    const data = await model.query(trx)
      .where('name', 'Group Code')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getTerm(trx) {
    const data = await model.query(trx)
      .where('name', 'Term')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'DECIMAL')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getTaxScheme(trx) {
    const data = await model.query(trx)
      .where('name', 'Tax Scheme')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'ENUMERATION')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getRecurringCharge(trx) {
    const data = await model.query(trx)
      .where('name', 'Recurring Charge')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'DECIMAL')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getEstablishmentCharge(trx) {
    const data = await model.query(trx)
      .where('name', 'Establishment Charge')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'DECIMAL')
      .andWhere('entityId', 20)
      .first();
    return data;
  }
}
module.exports = new service();
