const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "metaFieldName";
  }
}

module.exports = model;
