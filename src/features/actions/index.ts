"use server"

import { signIn, signOut } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import toast from "react-hot-toast"

export const  signInWithCredential=async(data:{email:string,password:string})=>{
    await signIn("credentials",{...data,redirectTo:"/dashboard"})
       revalidatePath('/dashboard')
              }
export const signInWithGithub=async()=>{
    await signIn("github",{redirectTo:"/dashboard"})
       revalidatePath('/dashboard')
              }

export const signInWithGoogle=async()=>{
    await signIn("google",{redirectTo:"/dashboard"})
       revalidatePath('/dashboard')
              }

export const signOutAuth=async()=>{
    await signOut();
       revalidatePath('/')
              }

// export const updateInterviewTranscript=async(interviewId:string,transcript:JSON)=>{
//     try {
//         const interview=await prisma.interview.update({             
//         })
//     } catch (error) {         
//     }
// }

