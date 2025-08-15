const databaseStaging = [
  {
    client: "postgresql",
    connection: {
      host: process.env.LOCALHOST,
      port: process.env.POSTGRESQL_REMOTE_PORT,
      user: process.env.STAGING_FORTY_SIX_DATABASE_USER,
      password: process.env.STAGING_FORTY_SIX_DATABASE_PASSWORD,
      database: process.env.STAGING_FORTY_SIX_DATABASE_NAME
    },
    pool: {
      min: 1,
      max: 200
    },
    query: "select now()"
  }
];

module.exports = databaseStaging;
