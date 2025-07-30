const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "userRoleMap";
  }

  static get idColumn() {
    return ['userId', 'roleId'];
  }
}

module.exports = model;
