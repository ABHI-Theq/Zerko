import prisma from "@/lib/prisma";
import { NextRequest,NextResponse } from "next/server"

export async function POST(req: NextRequest,{params}:{params:Promise<{ id: string }>}){
    try {
        const {id}=await params;

        if(!id){
            return NextResponse.json(
                { error: "Interview ID is required" },
                { status: 400 }
            );
        }

        // Parse request body
        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            console.error("Error parsing request body:", parseError);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        const {questions} = body;

        if(!questions || !Array.isArray(questions)){
            return NextResponse.json(
                { error: "Questions array is required" },
                { status: 400 }
            );
        }
        
        const interview=await prisma.interview.update({
            where:{
                id:id
            },
            data:{
                questions:questions
            }
        })

        console.log("Questions updated successfully:", {
            interviewId: id,
            questionCount: questions.length,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
            {
                success: true,
                message: "Questions updated successfully",
                interviewDets:interview
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error("Error updating questions:", error);
        
        // Handle Prisma-specific errors
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: "Interview not found" },
                { status: 404 }
            );
        }

        const errMsg=error instanceof Error?error.message:"Error updating questions"
        return NextResponse.json(
            { error:errMsg },
            { status: 500 }
        )
    }
} 