import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: credentials.email.trim(), mode: 'insensitive' } },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Post-login bookkeeping, batched into a SINGLE round-trip and never
        // allowed to block (or fail) the sign-in. Also opportunistically
        // downgrades legacy cost-12 password hashes to cost-10 so future
        // logins verify ~4x faster.
        const costMatch = /^\$2[aby]\$(\d{2})\$/.exec(user.password);
        const currentCost = costMatch ? parseInt(costMatch[1], 10) : 10;
        const updateData: { lastLoginAt: Date; password?: string } = { lastLoginAt: new Date() };
        if (currentCost > 10) {
          try { updateData.password = await bcrypt.hash(credentials.password, 10); } catch { /* keep old hash */ }
        }
        await prisma.$transaction([
          prisma.user.update({ where: { id: user.id }, data: updateData }),
          prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN', resource: 'auth' } }),
        ]).catch(() => { /* bookkeeping must never block sign-in */ });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
