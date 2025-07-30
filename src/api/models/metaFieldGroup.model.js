const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "metaFieldGroup";
  }
}

module.exports = model;
