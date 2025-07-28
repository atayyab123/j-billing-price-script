const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "itemEntityMap";
  }
}

module.exports = model;
