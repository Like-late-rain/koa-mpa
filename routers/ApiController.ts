import { GET, route } from "awilix-koa";
import type { Context } from "koa";
import type { IApi } from "@/interface/IApi";

@route("/api")
class ApiController {
  public apiService: IApi;
  constructor({ apiService }: { apiService: IApi }) {
    this.apiService = apiService;
  }

  @route("/list")
  @GET()
  async actionList(ctx: Context): Promise<void> {
    const data = await this.apiService.getInfo();
    ctx.body = {
      data: data.status + Math.random()
    };
  }
}

export default ApiController;
