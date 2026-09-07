import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // You can specify which fields should be submitted by adding keys to the `credentials` object.
    //
    // e.g. domain, username, password, 2FA token, etc.
    Credentials({
      credentials: { // The object which will be passed to the authorize function below
        username: { // Custom field
          label: 'Username',
          type: 'text',
        },
        password: { // Custom field
          label: 'Password',
          type: 'password',
        },
      },

      authorize: async (credentials) => {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null
          }

          const username = String(credentials.username)
          const password = String(credentials.password)

          // Check for existing user in the database


        } catch (error) {
          // Return null to indicate that the credentials are invalid
          return null
        }
      },
    })
  ],
})