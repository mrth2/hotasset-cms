module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('HEROKU_URL', 'http://localhost:1337'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '56e04191ce923d6d173274e848b799fc'),
    },
  },
});
