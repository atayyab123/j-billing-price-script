const { knexSnakeCaseMappers } = require("objection");
const knex = require("knex");
const tunnel = require('tunnel-ssh');

const connectDatabase = async (object) => {
  const { client, connection, pool, query } = object;
  try {
    if (process.env.NODE_ENV === "localhost") {
      const sshConfig = {
        username: process.env.SSH_USERNAME,
        host: process.env.SSH_HOST,
        port: process.env.SSH_PORT,
        dstHost: process.env.NODE_ENV,
        dstPort: process.env.POSTGRESQL_PORT,
        localHost: process.env.NODE_ENV,
        localPort: process.env.POSTGRESQL_REMOTE_PORT,
        password: process.env.SSH_PASSWORD,
      };
      tunnel(sshConfig);
    }
    const database = knex({
      client,
      connection,
      pool,
      ...knexSnakeCaseMappers(),
    });

    await database.raw(query);

    return {
      success: true,
      message: "Success: Database connected",
      database,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      message: "Failure: Database not connected",
      database: null,
      error
    };
  }
};

module.exports = connectDatabase;
