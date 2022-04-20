module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '5c0d62472665a69a66b44cc1d3033d12'),
  },
});
