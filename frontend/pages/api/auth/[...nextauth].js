import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
// import nodemailer from 'nodemailer'



const options = {
  // Configure one or more authentication providers
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    // Providers.Email({
    //   server: {
    //     host: process.env.NEXTAUTH_EMAIL_SERVER_HOST,
    //     port: process.env.NEXTAUTH_EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.NEXTAUTH_MAIL_SERVER_USER,
    //       pass: process.env.NEXTAUTH_EMAIL_SERVER_PASSWORD
    //     }
    //   },
    //   from: process.env.NEXTAUTH_EMAIL_FROM
    // }),
    Providers.Credentials({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: { label: "E-mail ou username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;
        const info = {
          'email': email,
          'username': email,
          'password': password
        };
        try {
          //custom route
          const authResq = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/local/register-if-non-existent-user`, {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json',
            },
            body: JSON.stringify(info)
          });

          const user = await authResq.json();
          if (!authResq.ok) {
            throw user
          }

          return Promise.resolve(user)
        }
        catch (error) {
          return Promise.reject(JSON.stringify(error))
        }
      }
    })
  ],

  // A database is optional, but required to persist accounts in a database
  database: {
    type: 'sqlite',
    database: ':memory:',
    synchronize: true
  },
  session: {
    jwt: true,
    // encryption: true,
  },
  debug: true,
  callbacks: {

    // https://next-auth.js.org/configuration/callbacks#jwt-callback
    jwt: async (token, user, account) => {
      const isSignIn = user ? true : false;

      if (isSignIn && account.provider) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/${account.provider}/callback?access_token=${account?.accessToken}`
        );

        const data = await response.json();

        token.jwt = data.jwt;
        token.id = data.user.id;
      }

      if (isSignIn && account.type === 'credentials') {
        token.jwt = user.jwt;
        token.id = account.id;
        token.name = user.user.username
        token.email = user.user.email
      }

      return Promise.resolve(token);
    },

    //https://next-auth.js.org/configuration/callbacks#session-callback
    session: async (session, user) => {
      session.jwt = user.jwt;
      session.id = user.id;

      return Promise.resolve(session);
    },
  },
}

const Auth = (req, res) => NextAuth(req, res, options)
export default Auth