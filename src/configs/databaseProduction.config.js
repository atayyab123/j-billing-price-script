const databaseProductionArray = [
  {
    client: "postgresql",
    connection: {
      host: process.env.LOCALHOST,
      port: process.env.POSTGRESQL_REMOTE_PORT,
      user: process.env.PRODUCTION_DATABASE_USER,
      password: process.env.PRODUCTION_DATABASE_PASSWORD,
      database: process.env.PRODUCTION_DATABASE_NAME
    },
    pool: {
      min: 1,
      max: 200
    },
    query: "select now()"
  }
];

module.exports = databaseProductionArray;
