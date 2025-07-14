const koaRouter = require("@koa/router")
const router = new koaRouter()
const controller = require("../controllers/script.controller")
const verifyCors = require("../../middleware/verifyCors.middleware")

router.get("/price-update", verifyCors, async (ctx, next) => {
  const response = await controller.priceUpdate();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

module.exports = router;
