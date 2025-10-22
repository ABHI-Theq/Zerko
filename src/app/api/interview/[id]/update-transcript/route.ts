import prisma from "@/lib/prisma";
import { NextResponse,NextRequest } from "next/server";

export async function POST(req:NextRequest,{params}:{params:{id:string}}){
    const {id}=await params;
    const {messages}=await req.json()
    try {
        if(!messages){
            return new Error("Error while setting up transcript of the interview")
        }
        const interview=await prisma.interview.update({
            where:{
                id:id
            },
            data:{
               transcript:messages 
            }
        })

        return NextResponse.json({
            status:200,
            interviewDets:interview
        })

    } catch (error) {
        const errMsg=error instanceof Error?error.message:"Error while setting up transcript"
        return NextResponse.json({
            status:500,
            error:errMsg
        })
    }
}