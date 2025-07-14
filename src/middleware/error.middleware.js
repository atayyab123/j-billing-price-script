const log = console.log;

function middleware() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      log("error handling middleware", error.message);
      const message = error.nativeError
        ? error.nativeError.sqlMessage
        : error.message;
      ctx.body = {
        success: false,
        message: message,
        data: null
      };
    }
  };
}

module.exports = middleware;
