const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "itemType";
  }

  static get relationMappings() {
    const item = require("./item.model");

    return {
      item: {
        relation: Model.ManyToManyRelation,
        modelClass: item,
        filter: (query) => query.select("id", "internalNumber", "entityId", "optlock", "priceManual"),
        join: {
          from: "itemType.id",
          through: {
            from: "itemTypeMap.typeId",
            to: "itemTypeMap.itemId",
          },
          to: "item.id"
        }
      }
    }
  }
}

module.exports = model;
