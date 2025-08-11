const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "customerMetaFieldMap";
  }
}

module.exports = model;
