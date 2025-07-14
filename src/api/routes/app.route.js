const koaRouter = require("@koa/router");
const router = new koaRouter();

const script = require("./script.route");

router.use("/script", script.routes(), script.allowedMethods());

module.exports = router;
