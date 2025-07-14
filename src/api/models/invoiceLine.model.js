const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "invoiceLine";
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
    const user = require("./baseUser.model");
    const order = require("./purchaseOrder.model");
    const invoice = require("./invoice.model");

    return {
      item: {
        relation: Model.BelongsToOneRelation,
        modelClass: item,
        filter: (query) => query.select("id", "internalNumber"),
        join: {
          from: "invoiceLine.itemId",
          to: "item.id"
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: user,
        filter: (query) => query.select("id", "userName"),
        join: {
          from: "invoiceLine.sourceUserId",
          to: "baseUser.id"
        }
      },
      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: order,
        filter: (query) => query.select("id", "userId", "periodId", "billingTypeId", "activeSince", "activeUntil", "cycleStart",
          "createDatetime", "nextBillableDay", "createdBy", "statusId", "currencyId", "notes", "primaryOrderId"),
        join: {
          from: "invoiceLine.orderId",
          to: "purchaseOrder.id"
        }
      },
      invoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: invoice,
        filter: (query) => query.select("id", "publicNumber", "userId", "statusId", "currencyId", "delegatedInvoiceId",
          "carriedBalance", "total", "balance", "dueDate", "paymentAttempts", "billingProcessID",
          "isReview", "customerNotes", "createDatetime"),
        join: {
          from: "invoiceLine.invoiceId",
          to: "invoice.id"
        }
      }
    };
  }
}

module.exports = model;
