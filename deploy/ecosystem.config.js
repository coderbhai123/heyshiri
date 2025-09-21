module.exports = {
  apps: [
    {
      name: 'rsvp-app',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 4000,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        ADMIN_TOKEN: process.env.ADMIN_TOKEN,
      },
    },
  ],
};
