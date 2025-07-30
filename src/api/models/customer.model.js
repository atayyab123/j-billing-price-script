const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "customer";
  }

  static get relationMappings() {
    const user = require("./baseUser.model");
    const metaFieldValue = require("./metaFieldValue.model");

    return {
      child: {
        relation: Model.HasManyRelation,
        modelClass: model,
        filter: (query) => query.select("id", "userId", "invoiceDeliveryMethodId", "parentId", "isParent", "invoiceChild", "optlock", "dynamicBalance",
          "creditLimit", "autoRecharge", "useParentPricing", "mainSubscriptOrderPeriodId", "nextInvoiceDayOfPeriod", "nextInoviceDate", "accountTypeId"
        ),
        join: {
          from: "customer.id",
          to: "customer.parentId"
        }
      },
      parent: {
        relation: Model.HasOneRelation,
        modelClass: model,
        filter: (query) => query.select("id", "userId", "invoiceDeliveryMethodId", "parentId", "isParent", "invoiceChild", "optlock", "dynamicBalance",
          "creditLimit", "autoRecharge", "useParentPricing", "mainSubscriptOrderPeriodId", "nextInvoiceDayOfPeriod", "nextInoviceDate", "accountTypeId"
        ),
        join: {
          from: "customer.parentId",
          to: "customer.id"
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: user,
        filter: (query) => query.select("id", "entityId", "deleted", "languageId", "statusId", "subscriberStatus", "currencyId", "createDatetime",
          "userName", "optlock", "encryptionScheme"),
        join: {
          from: "customer.userId",
          to: "baseUser.id"
        }
      },
      metaFieldValue: {
        relation: Model.ManyToManyRelation,
        modelClass: metaFieldValue,
        filter: (query) => query.select("id", "metaFieldNameId", "dtype", "booleanValue", "stringValue"),
        join: {
          from: "customer.id",
          through: {
            from: "customerMetaFieldMap.customerId",
            to: "customerMetaFieldMap.metaFieldValueId",
          },
          to: "metaFieldValue.id"
        }
      },
    };
  }
}

module.exports = model;
