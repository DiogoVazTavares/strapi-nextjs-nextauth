module.exports = ({ env }) => ({
  email: {
    provider: 'sendgrid',
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY'),
    },
    settings: {
      defaultFrom: 'diogo.vaz.tavares@gmail.com',
      defaultReplyTo: 'diogo.vaz.tavares@gmail.com',
    },
  },
});
