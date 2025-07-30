const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "metafieldGroupMetaFieldMap";
  }

  static get idColumn() {
    return ['metafieldGroupId', 'metaFieldValueId'];
  }
}

module.exports = model;
