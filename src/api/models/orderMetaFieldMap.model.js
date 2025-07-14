const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "orderMetaFieldMap";
  }
}

module.exports = model;
