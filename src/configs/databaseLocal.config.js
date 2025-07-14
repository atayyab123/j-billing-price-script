const databaseLocal = [
  {
    client: "postgresql",
    connection: {
      host: process.env.NODE_ENV,
      port: process.env.POSTGRESQL_REMOTE_PORT,
      user: process.env.LOCAL_DATABASE_USER,
      password: process.env.LOCAL_DATABASE_PASSWORD,
      database: process.env.LOCAL_DATABASE_NAME
    },
    pool: {
      min: 1,
      max: 200
    },
    query: "select now()"
  }
];

module.exports = databaseLocal;
