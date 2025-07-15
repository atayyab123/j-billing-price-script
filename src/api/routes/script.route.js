const koaRouter = require("@koa/router")
const router = new koaRouter()
const controller = require("../controllers/script.controller")
const verifyCors = require("../../middleware/verifyCors.middleware")

router.get("/price-update/sheet-one", verifyCors, async (ctx, next) => {
  const response = await controller.priceUpdateSheetOne();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

router.get("/price-update/sheet-two", verifyCors, async (ctx, next) => {
  const response = await controller.priceUpdateSheetTwo();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

module.exports = router;
