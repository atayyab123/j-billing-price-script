const databaseMyLocal = [
  {
    client: "postgresql",
    connection: {
      host: process.env.LOCALHOST,
      port: process.env.POSTGRESQL_PORT,
      user: process.env.LOCALHOST_DATABASE_USER,
      password: process.env.LOCALHOST_DATABASE_PASSWORD,
      database: process.env.LOCALHOST_DATABASE_NAME
    },
    pool: {
      min: 1,
      max: 200
    },
    query: "select now()"
  }
];

module.exports = databaseMyLocal;
