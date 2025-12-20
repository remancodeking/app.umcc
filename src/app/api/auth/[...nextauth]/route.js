import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        iqamaNumber: { label: 'Iqama Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();

        const loginId = (credentials.iqamaNumber || '').trim();
        const password = (credentials.password || '').trim();

        if (!loginId || !password) {
             throw new Error('Please provide Login ID and Password');
        }

        // Allow login with Iqama, Mobile, or SM Number
        // The frontend sends the input in the 'iqamaNumber' field
        const user = await User.findOne({
            $or: [
                { iqamaNumber: loginId },
                { mobile: loginId },
                { sm: loginId },
                { email: loginId }
            ]
        });

        if (!user) {
          throw new Error('User not found');
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            throw new Error('Invalid Password');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          shift: user.shift,
          isOnboarding: user.isOnboarding, // Pass onboarding status
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.shift = user.shift;
        token.isOnboarding = user.isOnboarding;
      }
      
      // Allow updating session from client side (e.g. after password change)
      if (trigger === "update" && session) {
          if (session.user.isOnboarding !== undefined) token.isOnboarding = session.user.isOnboarding;
          if (session.user.name) token.name = session.user.name;
          if (session.user.email) token.email = session.user.email;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.shift = token.shift;
        session.user.isOnboarding = token.isOnboarding;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
