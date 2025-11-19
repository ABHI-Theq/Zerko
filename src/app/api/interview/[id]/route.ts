import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest,{params}:{params:Promise<{ id: string }>}){
    try {
        const {id}=await params;

        if(!id){
            return NextResponse.json(
                { error: "Interview ID is required" },
                { status: 400 }
            );
        }

        const interview=await prisma.interview.findFirst({
            where:{
                id:id
            }
        })

        if (!interview) {
            return NextResponse.json(
                { error: "Interview not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                interview: interview,
                success: true 
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error fetching interview:", error);
        const errMsg=error instanceof Error?error.message:"Error fetching Interview details"
        return NextResponse.json(
            { error: errMsg },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest,{params}:{params:Promise<{ id: string }>}){
    try {
        const {id}=await params;

        if(!id){
            return NextResponse.json(
                { error: "Interview ID is required" },
                { status: 400 }
            );
        }

        const interview=await prisma.interview.delete({
            where:{
                id:id
            }
        })

        console.log("Interview deleted successfully:", id);

        return NextResponse.json(
            {
                success: true,
                message: "Interview deleted successfully",
                interviewId: id
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting interview:", error);
        
        // Handle Prisma-specific errors
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: "Interview not found" },
                { status: 404 }
            );
        }

        const errMsg = error instanceof Error ? error.message : "Error deleting interview";
        return NextResponse.json(
            { error: errMsg },
            { status: 500 }
        );
    }
}