"use server"

import { signIn } from "@/lib/auth"

export const  signInWithCredential=async(data:{email:string,password:string,redirectTo:string})=>{
    await signIn("credentials",data)
}
export const signInWithGithub=async()=>{
    await signIn("github",{redirectTo:"/"})
}

export const signInWithGoogle=async()=>{
    await signIn("google",{redirectTo:"/"})
}