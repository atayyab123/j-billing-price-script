require("dotenv").config();

const koa = require("koa");
const cors = require("@koa/cors");
const koaLogger = require("koa-logger");
const koaBody = require("koa-bodyparser");
const koaHelmet = require("koa-helmet");
const app = new koa();

const http = require("http");

const errorMiddleware = require("./src/middleware/error.middleware");
const router = require("./src/api/routes/app.route");
const databaseManager = require("./src/middleware/databaseManager.middleware");
const cookieParser = require("cookie-parser");
const serve = require("koa-static");
const { logForSessionWithTime } = require("./src/helper-function/log.helper");

const httpPort = process.env.HTTP_PORT;

app
  .use(databaseManager)
  .use(serve("."))
  .use(errorMiddleware())
  .use(koaHelmet())
  .use(koaLogger())
  .use(koaBody({ jsonLimit: "100mb", formLimit: "100mb", textLimit: "100mb" }))
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(cookieParser());

http
  .createServer(app.callback())
  .listen(httpPort, () => {
    logForSessionWithTime("http/config", {
      httpPort: httpPort,
      NODE_ENV: process.env.NODE_ENV,
      MANAGEMENT_IP: process.env.MANAGEMENT_IP,
      NODE_ENV_PRIVATE_IP: process.env.NODE_ENV_PRIVATE_IP,
    })
  });