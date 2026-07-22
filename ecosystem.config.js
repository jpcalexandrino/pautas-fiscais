module.exports = {
  apps: [
    {
      name: 'pricer',
      script: './server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
