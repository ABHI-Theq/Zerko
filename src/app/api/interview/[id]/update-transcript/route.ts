import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }

    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
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

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Update interview transcript
    const interview = await prisma.interview.update({
      where: {
        id: id,
        userId: session.user.id
      },
      data: {
        transcript: messages,
      },
    });

    console.log("Transcript updated successfully:", {
      interviewId: id,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Transcript saved successfully",
        interviewDets: interview 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating transcript:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Interview not found or you don't have permission to update it" },
        { status: 404 }
      );
    }
    
    const errMsg = error instanceof Error
      ? error.message
      : "Error while updating transcript";
      
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
