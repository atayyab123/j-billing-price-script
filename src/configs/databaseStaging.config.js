const databaseStaging = [
  {
    client: "postgresql",
    connection: {
      host: process.env.STAGING_IP_URL,
      port: process.env.POSTGRESQL_PORT,
      user: process.env.STAGING_DATABASE_USER,
      password: process.env.STAGING_DATABASE_PASSWORD,
      database: process.env.STAGING_DATABASE_NAME
    },
    pool: {
      min: 1,
      max: 200
    },
    query: "select now()"
  }
];

module.exports = databaseStaging;
