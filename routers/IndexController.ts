import { GET, route } from "awilix-koa";
import type { Context } from "koa";

@route("/")
class IndexController {
  @GET()
  async actionList(ctx: Context): Promise<void> {
    ctx.body = await ctx.render("index", { data: "hello world" });
  }
}

export default IndexController;
