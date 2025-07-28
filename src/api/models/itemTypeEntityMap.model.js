const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "itemTypeEntityMap";
  }

  static get idColumn() {
    return ['entityId', 'itemTypeId'];
  }

  static get relationMappings() {
    const itemType = require("./itemType.model");

    return {
      itemType: {
        relation: Model.BelongsToOneRelation,
        modelClass: itemType,
        filter: (query) => query.select("id", "entityId", "description", "orderLineTypeId", "optlock", "internal"),
        join: {
          from: "itemTypeEntityMap.itemTypeId",
          to: "itemType.id"
        }
      }
    }
  }
}

module.exports = model;
