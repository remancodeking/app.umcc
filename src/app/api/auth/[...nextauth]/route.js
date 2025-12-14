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
        mobile: { label: 'Mobile', type: 'text' },
        password: { label: 'Password', type: 'password' },
        iqamaNumber: { label: 'Iqama Number', type: 'text' },
      },
      async authorize(credentials) {
        await dbConnect();

        // 1. Employee Login (Iqama + Mobile) - No Password required as per prompt specs for login
        if (credentials.iqamaNumber && credentials.mobile && !credentials.password) {
          const user = await User.findOne({
            iqamaNumber: credentials.iqamaNumber,
            mobile: credentials.mobile,
          });

          if (!user) {
            throw new Error('Invalid Credentials');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            shift: user.shift, // Added shift
          };
        }

        // 2. User Login (Mobile + Password)
        if (credentials.mobile && credentials.password) {
          const user = await User.findOne({ mobile: credentials.mobile });

          if (!user) {
            throw new Error('User not found');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            shift: user.shift, // Added shift
          };
        }

        throw new Error('Invalid credentials');
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.shift = user.shift; // Added shift
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.shift = token.shift; // Added shift
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
