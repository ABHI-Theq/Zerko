import NextAuth, { NextAuthConfig } from "next-auth";

import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import Email from "next-auth/providers/email";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({ user, profile, account, credentials }) {
      if (!user || !account) return false;

      const existingUser = await prisma.user.findUnique({
        where: {
          email: user.email as string,
        },
      });
      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name!,
            accounts: {
              create: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                type: account.type,
                access_token: account.access_token ?? "",
                refresh_token: account.refresh_token ?? "",
                scope: account.scope ?? undefined,
                expires_at: account.expires_at
                  ? Math.floor(account.expires_at)
                  : null,
                token_type: account.token_type ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state
                  ? String(account.session_state)
                  : null,
              },
            },
          },
        });

        if (!newUser) return false;
      } else {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              refresh_token: account.refresh_token ?? "",
              access_token: account.access_token ?? "",
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: JSON.stringify(account.session_state),
              userId: existingUser.id, // Link to existing user
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (!token.sub) return token;

      const existingUser = await prisma.user.findUnique({
        where: {
          id: token.sub,
        },
        include: { accounts: true },
      });
      if(!existingUser) return token;

      token.name=existingUser.name;
      token.email=existingUser.email;

      return token;
    },
    async session({user,session,token}){
      if(token.sub && session.user){
        session.user.id=token.sub;
      }
      return session;
    }
  },
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig
});
