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
    const itemEntityMap = require("./itemEntityMap.model");
    const metaFieldValue = require("./metaFieldValue.model");

    return {
      internationalDescription: {
        relation: Model.HasOneRelation,
        modelClass: internationalDescription,
        join: {
          from: "item.id",
          to: "internationalDescription.foreignId"
        }
      },
      itemEntityMap: {
        relation: Model.HasOneRelation,
        modelClass: itemEntityMap,
        join: {
          from: "item.id",
          to: "itemEntityMap.itemId"
        }
      },
      metaFieldValue: {
        relation: Model.ManyToManyRelation,
        modelClass: metaFieldValue,
        filter: (query) => query.select("id", "metaFieldNameId", "dtype", "decimalValue", "stringValue"),
        join: {
          from: "item.id",
          through: {
            from: "itemMetaFieldMap.itemId",
            to: "itemMetaFieldMap.metaFieldValueId",
          },
          to: "metaFieldValue.id"
        }
      }
    }
  }
}

module.exports = model;
