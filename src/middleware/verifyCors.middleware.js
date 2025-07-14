/* eslint-disable no-undef */
const allowedOrigins = require("../configs/allowedOrigin.config");
const allowedOriginStaging = require("../configs/allowedOriginStaging.config");

const verifyCors = async (ctx, next) => {
  const referer = ctx.request.header.referer;

  console.log("-------------------------------------------------");
  console.log("referer", referer);
  console.log("-------------------------------------------------");

  if (
    process.env.NODE_ENV_PRIVATE_IP &&
    process.env.NODE_ENV !== "production"
  ) {
    return next();
  }

  if (process.env.NODE_ENV === "production") {
    console.log("-------------------------------------------------");
    console.log("allowedOrigins", allowedOrigins);
    console.log("-------------------------------------------------");
    if (!referer?.startsWith(process.env.PRODUCTION_WEB_URL)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "Failure: Request not allowed for Production",
        data: null,
      };
      return;
    }
  } else if (process.env.NODE_ENV === "staging") {
    console.log("-------------------------------------------------");
    console.log("allowedOriginStaging", allowedOriginStaging);
    console.log("-------------------------------------------------");
    if (!referer || allowedOriginStaging.indexOf(referer) === -1) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "Failure: Request not allowed for Staging",
        data: null,
      };
      return;
    }
  }

  return next();
};

module.exports = verifyCors;
