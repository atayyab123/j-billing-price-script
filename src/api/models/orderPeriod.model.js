const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "orderPeriod";
  }
}

module.exports = model;
