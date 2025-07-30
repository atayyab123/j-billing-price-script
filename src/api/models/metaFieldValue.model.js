const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "metaFieldValue";
  }

  static get relationMappings() {
    const metaFieldName = require("./metaFieldName.model");
    const user = require("./baseUser.model");
    const order = require("./purchaseOrder.model");
    const metafieldGroupMetaFieldMap = require("./metafieldGroupMetaFieldMap.model")

    return {
      metaFieldName: {
        relation: Model.BelongsToOneRelation,
        modelClass: metaFieldName,
        filter: (query) => query.select("id", "name", "entityType", "entityId"),
        join: {
          from: "metaFieldValue.metaFieldNameId",
          to: "metaFieldName.id"
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: user,
        filter: (query) => query.select("id", "userName"),
        join: {
          from: "metaFieldValue.stringValue",
          to: "baseUser.userName"
        }
      },
      order: {
        relation: Model.HasOneThroughRelation,
        modelClass: order,
        filter: (query) => query.select("id", "activeUntil"),
        join: {
          from: "metaFieldValue.id",
          through: {
            from: "orderMetaFieldMap.metaFieldValueId",
            to: "orderMetaFieldMap.orderId",
          },
          to: "purchaseOrder.id"
        }
      },
      metafieldGroupMetaFieldMap: {
        relation: Model.HasOneRelation,
        modelClass: metafieldGroupMetaFieldMap,
        join: {
          from: "metaFieldValue.id",
          to: "metafieldGroupMetaFieldMap.metaFieldValueId"
        }
      }
    }
  }
}

module.exports = model;
