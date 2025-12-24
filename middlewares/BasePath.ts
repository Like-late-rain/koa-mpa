import config from "@config";
import type { Context, Next } from "koa";

/**
 * 给所有模板渲染添加 basePath
 */
export default async function basePathMiddleware(ctx: Context, next: Next) {
  const originalRender = ctx.render;

  // 重写 render 方法，自动添加 basePath
  ctx.render = function (view: string, locals?: Record<string, unknown>) {
    const enhancedLocals = {
      basePath: config.basePath,
      ...locals
    };
    return originalRender.call(ctx, view, enhancedLocals);
  };

  await next();
}
