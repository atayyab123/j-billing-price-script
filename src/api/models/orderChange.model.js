const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "orderChange";
  }
}

module.exports = model;
