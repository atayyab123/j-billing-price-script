const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "internationalDescription";
  }
}

module.exports = model;
