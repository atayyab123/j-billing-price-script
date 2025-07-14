const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "item";
  }

  static get modifiers() {
    return {
      filterActive(builder) {
        builder.where('deleted', 0);
      }
    }
  }

  static get relationMappings() {
    const internationalDescription = require("./internationalDescription.model");

    return {
      internationalDescription: {
        relation: Model.HasOneRelation,
        modelClass: internationalDescription,
        join: {
          from: "item.id",
          to: "internationalDescription.foreignId"
        }
      }
    }
  }
}

module.exports = model;
