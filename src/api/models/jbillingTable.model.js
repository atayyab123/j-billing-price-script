const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "jbillingTable";
  }
}

module.exports = model;
