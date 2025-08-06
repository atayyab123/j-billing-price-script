const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "itemMetaFieldMap";
  }
}

module.exports = model;
