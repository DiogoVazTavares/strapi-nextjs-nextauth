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

// const sendVerificationRequest = ({ identifier: email, url, token, baseUrl, provider }) => {
//   return new Promise((resolve, reject) => {
//     console.log(email, url, token, baseUrl, provider);
//     const { server, from } = provider
//     // Strip protocol from URL and use domain as site name
//     const site = baseUrl.replace(/^https?:\/\//, '')

//     nodemailer
//       .createTransport(server)
//       .sendMail({
//         to: email,
//         from,
//         subject: `Sign in to ${site}`,
//         text: text({ url, site, email }),
//         html: html({ url, site, email })
//       }, (error) => {
//         if (error) {
//           logger.error('SEND_VERIFICATION_EMAIL_ERROR', email, error)
//           return reject(new Error('SEND_VERIFICATION_EMAIL_ERROR', error))
//         }
//         return resolve()
//       })
//   })
// }

// // Email HTML body
// const html = ({ url, site, email }) => {
//   // Insert invisible space into domains and email address to prevent both the
//   // email address and the domain from being turned into a hyperlink by email
//   // clients like Outlook and Apple mail, as this is confusing because it seems
//   // like they are supposed to click on their email address to sign in.
//   const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`
//   const escapedSite = `${site.replace(/\./g, '&#8203;.')}`

//   // Some simple styling options
//   const backgroundColor = '#f9f9f9'
//   const textColor = '#444444'
//   const mainBackgroundColor = '#ffffff'
//   const buttonBackgroundColor = '#346df1'
//   const buttonBorderColor = '#346df1'
//   const buttonTextColor = '#ffffff'

//   // Uses tables for layout and inline CSS due to email client limitations
//   return `
// <body style="background: ${backgroundColor};">
//   <table width="100%" border="0" cellspacing="0" cellpadding="0">
//     <tr>
//       <td align="center" style="padding: 10px 0px 20px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
//         <strong>${escapedSite}</strong>
//       </td>
//     </tr>
//   </table>
//   <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
//     <tr>
//       <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
//         Sign in as <strong>${escapedEmail}</strong>
//       </td>
//     </tr>
//     <tr>
//       <td align="center" style="padding: 20px 0;">
//         <table border="0" cellspacing="0" cellpadding="0">
//           <tr>
//             <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; text-decoration: none;border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Sign in</a></td>
//           </tr>
//         </table>
//       </td>
//     </tr>
//     <tr>
//       <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
//         If you did not request this email you can safely ignore it.
//       </td>
//     </tr>
//   </table>
// </body>
// `
// }

// // Email text body – fallback for email clients that don't render HTML
// const text = ({ url, site }) => `Sign in to ${site}\n${url}\n\n`