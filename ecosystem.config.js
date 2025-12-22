module.exports = {
  apps: [
    {
      name: "koa-mpa",
      script: "./dist/app.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // 环境变量配置
      env_production: {
        NODE_ENV: "production",
        PORT: 8082,
        LOG_LEVEL: "error",
        TS_NODE_PROJECT: "./tsconfig.json"
      },

      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // 优雅重启配置
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // 自动重启配置
      min_uptime: "10s",
      max_restarts: 10,

      // 性能监控
      instance_var: "INSTANCE_ID"
    },
    {
      name: "koa-mpa-dev",
      script: "./app.ts",
      interpreter: "node",
      interpreter_args: "--require ts-node/register",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: ["app.ts", "routers", "services", "middlewares", "config"],
      ignore_watch: ["node_modules", "logs", "dist", ".git", ".history"],
      watch_delay: 1000,
      max_memory_restart: "500M",

      // 开发环境变量
      env: {
        NODE_ENV: "development",
        PORT: 8081,
        LOG_LEVEL: "debug",
        TS_NODE_PROJECT: "./tsconfig.json"
      },

      error_file: "./logs/pm2-dev-error.log",
      out_file: "./logs/pm2-dev-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
