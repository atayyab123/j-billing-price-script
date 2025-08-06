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

router.get("/price-update/sheet-four", verifyCors, async (ctx, next) => {
  const response = await controller.priceUpdateSheetFour();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

router.get("/price-update/sheet-three", verifyCors, async (ctx, next) => {
  const response = await controller.priceUpdateSheetThree();
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

router.get("/products", verifyCors, async (ctx, next) => {
  const response = await controller.products();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

router.get("/user-hierarchy", verifyCors, async (ctx, next) => {
  const response = await controller.userHierarchy();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

router.get("/service/order-line", verifyCors, async (ctx, next) => {
  const response = await controller.serviceOrderLine();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

router.get("/products/delete", verifyCors, async (ctx, next) => {
  const response = await controller.productsDelete();
  ctx.status = response.status;
  ctx.body = response.data;
  console.log(response);
});

module.exports = router;
