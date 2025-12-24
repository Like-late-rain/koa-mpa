// Load environment variables first
import "dotenv/config";

import { addAliases } from "module-alias";

addAliases({
  "@root": __dirname,
  "@config": `${__dirname}/config`,
  "@routers": `${__dirname}/routers`,
  "@services": `${__dirname}/services`,
  "@interfaces": `${__dirname}/interfaces`,
  "@middlewares": `${__dirname}/middlewares`,
  "@generated": `${__dirname}/generated`,
  "@lib": `${__dirname}/lib`
});

import config from "@config";
import cors from "@koa/cors";
import render from "@koa/ejs";
import basePathMiddleware from "@middlewares/BasePath";
import ErrorHandler from "@middlewares/ErrorHandler";
import { createContainer, Lifetime } from "awilix";
import { loadControllers, scopePerRequest } from "awilix-koa";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import serve from "koa-static";
import historyApiFallback from "koa2-connect-history-api-fallback";
import { configure, getLogger } from "log4js";

const app = new Koa();

// Lambda 环境使用 console 日志，本地环境使用文件日志
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
configure({
  appenders: {
    console: { type: "console" },
    file: { type: "file", filename: `${__dirname}/logs/info.log` }
  },
  categories: {
    default: {
      appenders: isLambda ? ["console"] : ["file"],
      level: "error"
    }
  }
});

// 创建容器
const container = createContainer();
const { port, viewDir, memoryFlag, staticDir } = config;

// CORS 配置 - 允许跨域请求
app.use(
  cors({
    origin: "*", // 开发环境允许所有来源，生产环境应该指定具体域名
    credentials: true, // 允许携带 cookie
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"]
  })
);

app.use(serve(staticDir));

// 解析请求体
app.use(bodyParser());

// 所有服务都注册到容器中
// 根据环境选择不同的文件模式，避免在生产环境加载 .d.ts 文件
const filePattern =
  process.env.NODE_ENV === "production"
    ? `${__dirname}/services/*.js`
    : `${__dirname}/services/*{.ts,.js}`;

container.loadModules([filePattern], {
  formatName: "camelCase",
  resolverOptions: {
    // 生命周期 SCOPED(作用域)、SINGLETON(单例)、TRANSIENT(多例)
    lifetime: Lifetime.SINGLETON
  }
});
// 把路由和容器绑定一起
app.use(scopePerRequest(container));

render(app, {
  root: viewDir,
  layout: false,
  viewExt: "html",
  cache: memoryFlag,
  debug: false
});

// 添加 basePath 到所有模板
app.use(basePathMiddleware);

//除去api 以外的路由 全部映射回index.html 让前端路由来处理
app.use(
  historyApiFallback({
    index: "/",
    whiteList: ["/api", "/form-data", "/github", "/users", "/styles", "/scripts", "/favicon"]
  })
);

// 日志
const logger = getLogger("cheese");
ErrorHandler.error(app, logger);

const routerPattern =
  process.env.NODE_ENV === "production"
    ? `${__dirname}/routers/*.js`
    : `${__dirname}/routers/*{.ts,.js}`;

app.use(loadControllers(routerPattern));

// if (process.env.NODE_ENV === "development") {
app.listen(port, () => {
  console.log(`Koa server is running on http://localhost:${port}`);
});
// }

export default app;
