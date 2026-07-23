export default {
  apps: [
    {
      name: 'pricer',
      script: './server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: './server/.env', 
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      }
    },
  ],
};

