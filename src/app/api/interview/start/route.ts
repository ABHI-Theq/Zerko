import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(res: NextRequest){
    const {post,userId,jobdescription,interviewType,duration}=await res.json();

    try {
        const newInterview=await prisma.interview.create({
            data:{
                userId:userId,
                post:post as string,
                jobDescription:jobdescription,
                interviewType:interviewType,
                startedAt: new Date(),
                duration:duration,
            }
        })

    } catch (error) {
     const errMsg=error instanceof Error?error.message:"error occured while creating interview"
     return NextResponse.json({
        error:errMsg,
        status:500
    })
}
}