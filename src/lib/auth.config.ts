
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";
import { userSigninSchema } from "@/types";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { NextAuthConfig } from "next-auth";

export const authConfig={
    providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
        },
        password: {
          type: "password"
        },
      },
      authorize: async (credentials) => {
        let user = null;
        console.log(credentials);
        

        const {email,password}=await userSigninSchema.parseAsync(credentials);

      
        user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          console.error("No user exists with this email");
          return null;
        }
        const isvalid = await bcrypt.compare(
          credentials.password as string,
          user.password as string
        );
        if (!isvalid) {
          console.error("password does not match");
          return null;
        }

        return user;
      },
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
} satisfies NextAuthConfig