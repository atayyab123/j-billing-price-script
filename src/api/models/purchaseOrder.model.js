const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "purchaseOrder";
  }

  static get modifiers() {
    return {
      filterActive(builder) {
        builder.where('deleted', 0);
      }
    }
  }

  static get relationMappings() {
    const orderLine = require("./orderLine.model");
    const currency = require("./currency.model");
    const baseUser = require("./baseUser.model");
    const orderPeriod = require("./orderPeriod.model");
    const metaFieldValue = require("./metaFieldValue.model");
    const invoiceLine = require("./invoiceLine.model");

    return {
      orderLine: {
        relation: Model.HasManyRelation,
        modelClass: orderLine,
        filter: (query) =>
          query.select(
            "id",
            "orderId",
            "itemId",
            "amount",
            "quantity",
            "price"
          ),
        join: {
          from: "purchaseOrder.id",
          to: "orderLine.orderId"
        }
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: currency,
        filter: (query) => query.select("id", "code"),
        join: {
          from: "purchaseOrder.currencyId",
          to: "currency.id"
        }
      },
      baseUserId: {
        relation: Model.BelongsToOneRelation,
        modelClass: baseUser,
        filter: (query) => query.select("id", "userName"),
        join: {
          from: "purchaseOrder.userId",
          to: "baseUser.id"
        }
      },
      baseUserCreatedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: baseUser,
        filter: (query) => query.select("id", "userName"),
        join: {
          from: "purchaseOrder.createdBy",
          to: "baseUser.id"
        }
      },
      orderPeriod: {
        relation: Model.BelongsToOneRelation,
        modelClass: orderPeriod,
        join: {
          from: "purchaseOrder.periodId",
          to: "orderPeriod.id"
        }
      },
      metaFieldValue: {
        relation: Model.ManyToManyRelation,
        modelClass: metaFieldValue,
        filter: (query) => query.select("id", "metaFieldNameId", "dtype", "stringValue"),
        join: {
          from: "purchaseOrder.id",
          through: {
            from: "orderMetaFieldMap.orderId",
            to: "orderMetaFieldMap.metaFieldValueId",
          },
          to: "metaFieldValue.id"
        }
      },
      invoiceLine: {
        relation: Model.HasManyRelation,
        modelClass: invoiceLine,
        filter: (query) =>
          query.select(
            "id",
            "orderId",
            "itemId",
            "typeId",
            "amount",
            "quantity",
            "price",
            "invoiceId",
            "deleted",
            "sourceUserId",
            "description",
          ),
        join: {
          from: "purchaseOrder.id",
          to: "invoiceLine.orderId"
        }
      }
    };
  }
}

module.exports = model;
