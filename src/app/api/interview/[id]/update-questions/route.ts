import prisma from "@/lib/prisma";
import { NextRequest,NextResponse } from "next/server"

export async function POST(req: NextRequest,{params}:{params:{id:string}}){
    const {id}=await params;
    const {questions}=await req.json();

    try {
        if(!questions){
            return new Error("error question list is not there")
        }
        const interview=await prisma.interview.update({
        where:{
            id:id
        },
        data:{
            questions:questions
        }
        })
        return NextResponse.json({
            interviewDets:interview,
            status:200
        })
    } catch (error) {
        const errMsg=error instanceof Error?error.message:"Error updating questions"
        return NextResponse.json({
            error:errMsg,
            status:400
        })
    }
} 