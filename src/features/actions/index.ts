"use server"

import { signIn, signOut } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export const  signInWithCredential=async(data:{email:string,password:string})=>{
    await signIn("credentials",{...data,redirect:false})
       revalidatePath('/')
             
}
export const signInWithGithub=async()=>{
    await signIn("github",{redirectTo:"/"})
       revalidatePath('/')
             
}

export const signInWithGoogle=async()=>{
    await signIn("google",{redirectTo:"/"})
       revalidatePath('/')
             
}

export const signOutAuth=async()=>{
    await signOut();
       revalidatePath('/')
             
}