// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({ user, profile, account }) {
      if (!user || !account) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email as string },
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            email: (user.email as string) ?? profile?.email,
            name: (user.name as string) ?? profile?.name,
            image: user.image ?? profile?.picture ?? "/user.png",
            accounts: {
              create: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                type: account.type,
                access_token: account.access_token ?? "",
                refresh_token: account.refresh_token ?? "",
                scope: account.scope ?? undefined,
                expires_at: account.expires_at ? Math.floor(account.expires_at) : null,
                token_type: account.token_type ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ? String(account.session_state) : null,
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
              userId: existingUser!.id,
            },
          });
        }
        if (!existingUser!.image) {
          await prisma.user.update({
            where: { id: existingUser!.id },
            data: { image: user.image ?? profile?.picture ?? "/user.png" },
          });
        }
      }

      return true;
    },

    // Use session callback that expects user (from DB) when using database sessions.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.image = user.image ?? "/user.png";
      }
      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  ...authConfig,
});
