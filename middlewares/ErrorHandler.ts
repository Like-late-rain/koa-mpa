import type Koa from "koa";
import type { Logger } from "log4js";

// biome-ignore lint/complexity/noStaticOnlyClass: utility class for error middleware setup
class ErrorHandler {
  static async error(app: Koa, logger: Logger) {
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e: unknown) {
        logger.error(e);
        //  设置状态码
        ctx.status = 500;

        //  构造错误信息
        const errorMessage = e instanceof Error ? e.stack : String(e);

        await ctx.render("500", { errorMessage });
      }
    });
    app.use(async (ctx, next) => {
      await next();

      if (ctx.status !== 404) {
        return;
      }
      await ctx.render("404");
    });
  }
}

export default ErrorHandler;
