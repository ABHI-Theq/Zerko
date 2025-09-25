"use server"

import { signIn, signOut } from "@/lib/auth"
import prisma from "@/lib/prisma"
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

export const updateInterviewTranscript=async(interviewId:string,transcript:JSON)=>{
    try {
        const interview=await prisma.interview.update({
            
        })
    } catch (error) {
        
    }
}