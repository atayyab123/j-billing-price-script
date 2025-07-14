const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "orderStatus";
  }
}

module.exports = model;
