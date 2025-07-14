const { Model } = require("objection");

const connectDatabase = require("../database/connectDatabase");
const { selectDataBase } = require("../helper-function/other.helper");
let connected = false;

const databaseManager = async (ctx, next) => {
  if (connected) return await next();

  const databaseArray = selectDataBase();

  for await (const iterator of databaseArray) {
    const response = await connectDatabase(iterator);

    console.log("--------------------------------------");
    console.log("NODE_ENV: ", process.env.NODE_ENV);
    console.log("MANAGEMENT_IP: ", process.env.MANAGEMENT_IP);
    console.log("NODE_ENV_PRIVATE_IP: ", process.env.NODE_ENV_PRIVATE_IP);
    console.log("database", {
      client: iterator.client,
      host: iterator.connection.host,
      port: iterator.connection.port,
    });
    console.log("response", {
      success: response?.success,
      message: response?.message,
    });
    console.log("--------------------------------------");

    if (response?.success) {
      connected = true;
      Model.knex(response?.database);
      return await next();
    }
  }

  ctx.status = 500;
  ctx.body = {
    success: false,
    message: "Failure: Database not connected",
    data: null,
  };

  console.log("--------------------------------------");
  console.log(ctx.body);
  console.log("--------------------------------------");
};

module.exports = databaseManager;
