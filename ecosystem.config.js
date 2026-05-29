// PM2 ecosystem config for production
// Usage: pm2 start ecosystem.config.js --env production
// Install pm2 first: sudo npm install -g pm2

module.exports = {
  apps: [
    {
      name: "print-on-demand",
      script: ".next/standalone/server.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
      },
      max_memory_restart: "1G",
      instances: 1,
      autorestart: true,
      watch: false,
      log_file: "/var/log/pm2/print-on-demand.log",
      error_file: "/var/log/pm2/print-on-demand-error.log",
    },
  ],
};
