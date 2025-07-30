const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "baseUser";
  }

  static get modifiers() {
    return {
      filterActive(builder) {
        builder.where('deleted', 0);
      }
    }
  }

  static get relationMappings() {
    const order = require("./purchaseOrder.model");
    const customer = require("./customer.model");
    const userRoleMap = require("./userRoleMap.model");

    return {
      order: {
        relation: Model.HasManyRelation,
        modelClass: order,
        filter: (query) => query.select("id", "userId", "periodId", "billingTypeId", "activeSince", "activeUntil", "cycleStart",
          "createDatetime", "nextBillableDay", "createdBy", "statusId", "currencyId", "notes", "primaryOrderId"),
        join: {
          from: "baseUser.id",
          to: "purchaseOrder.userId"
        }
      },
      customer: {
        relation: Model.HasOneRelation,
        modelClass: customer,
        filter: (query) => query.select("id", "userId", "parentId", "isParent", "invoiceChild", "dynamicBalance", "creditLimit",
          "mainSubscriptOrderPeriodId", "nextInvoiceDayOfPeriod", "nextInoviceDate", "accountTypeId"
        ),
        join: {
          from: "baseUser.id",
          to: "customer.userId"
        }
      },
      userRoleMap: {
        relation: Model.HasOneRelation,
        modelClass: userRoleMap,
        join: {
          from: "baseUser.id",
          to: "userRoleMap.userId"
        }
      }
    }
  }
}

module.exports = model;
