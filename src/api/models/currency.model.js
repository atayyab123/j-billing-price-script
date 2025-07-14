const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "currency";
  }
}

module.exports = model;
