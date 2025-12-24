import { join } from "node:path";

let config = {
  viewDir: join(__dirname, "..", "views"),
  staticDir: join(__dirname, "..", "assets"),
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
  memoryFlag: false,
  basePath: "" // Lambda Function URL 不需要路径前缀
};

if (process.env.NODE_ENV === "development") {
  const localConfig = {
    prot: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081
  };

  config = Object.assign(config, localConfig);
}

if (process.env.NODE_ENV === "production") {
  const prodConfig = {
    prot: process.env.PORT ? parseInt(process.env.PORT, 10) : 8082,
    memoryFlag: "memory"
  };

  config = Object.assign(config, prodConfig);
}

export default config;
