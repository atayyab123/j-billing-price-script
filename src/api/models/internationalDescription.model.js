const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "internationalDescription";
  }

  static get idColumn() {
    return ['tableId', 'foreignId', 'languageId'];
  }
}

module.exports = model;
