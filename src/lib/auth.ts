import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import {saltAndHashPassword} from "@/util/password"

import { PrismaAdapter } from "@auth/prisma-adapter"
import  prisma  from "@/lib/prisma" 

export const { handlers, signIn, signOut, auth } = NextAuth({

  
  secret:process.env.AUTH_SECRET,
  adapter:PrismaAdapter(prisma),
  session:{strategy:'jwt'},
  providers:[

  ]
})