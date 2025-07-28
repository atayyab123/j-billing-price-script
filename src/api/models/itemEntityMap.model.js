const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "itemEntityMap";
  }

  static get idColumn() {
    return ['entityId', 'itemId'];
  }
}

module.exports = model;
