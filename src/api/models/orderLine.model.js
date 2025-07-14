const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "orderLine";
  }

  static get modifiers() {
    return {
      filterActive(builder) {
        builder.where('deleted', 0);
      }
    }
  }

  static get relationMappings() {
    const item = require("./item.model");

    return {
      item: {
        relation: Model.BelongsToOneRelation,
        modelClass: item,
        filter: (query) => query.select("id", "internalNumber"),
        join: {
          from: "orderLine.itemId",
          to: "item.id"
        }
      }
    };
  }
}

module.exports = model;
