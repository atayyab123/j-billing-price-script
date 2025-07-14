const { Model } = require("objection");

class model extends Model {
  static get tableName() {
    return "invoice";
  }

  static get modifiers() {
    return {
      filterActive(builder) {
        builder.where('deleted', 0);
      }
    }
  }

  static get relationMappings() {
    const invoiceLine = require("./invoiceLine.model");
    const user = require("./baseUser.model");

    return {
      invoiceLine: {
        relation: Model.HasManyRelation,
        modelClass: invoiceLine,
        join: {
          from: "invoice.id",
          to: "invoiceLine.invoiceId"
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: user,
        filter: (query) => query.select("id", "userName"),
        join: {
          from: "invoice.userId",
          to: "baseUser.id"
        }
      }
    };
  }
}

module.exports = model;
