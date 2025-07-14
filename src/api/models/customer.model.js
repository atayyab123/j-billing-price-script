const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "customer";
  }

  static get relationMappings() {
    const user = require("./baseUser.model");

    return {
      child: {
        relation: Model.HasManyRelation,
        modelClass: model,
        filter: (query) => query.select("id", "userId", "parentId", "isParent", "invoiceChild", "dynamicBalance", "creditLimit",
          "mainSubscriptOrderPeriodId", "nextInvoiceDayOfPeriod", "nextInoviceDate", "accountTypeId"
        ),
        join: {
          from: "customer.id",
          to: "customer.parentId"
        }
      },
      parent: {
        relation: Model.HasOneRelation,
        modelClass: model,
        filter: (query) => query.select("id", "userId", "parentId", "isParent", "invoiceChild", "dynamicBalance", "creditLimit",
          "mainSubscriptOrderPeriodId", "nextInvoiceDayOfPeriod", "nextInoviceDate", "accountTypeId"
        ),
        join: {
          from: "customer.parentId",
          to: "customer.id"
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: user,
        filter: (query) => query.select("id", "userName", "currencyId"),
        join: {
          from: "customer.userId",
          to: "baseUser.id"
        }
      }
    };
  }
}

module.exports = model;
