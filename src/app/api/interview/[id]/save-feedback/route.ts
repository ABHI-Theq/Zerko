import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;

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
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { feedback } = body;

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback data is required" },
        { status: 400 }
      );
    }

    const updatedInterview = await prisma.interview.update({
      where: { 
        id: id,
        userId: session.user.id
      },
      data: {
        feedbackStr: feedback.feedBackStr,
        overall_rating: feedback.overall_rating,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        feedbackGenerated: true,
      },
    });

    console.log("Feedback saved successfully:", {
      interviewId: id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Feedback saved successfully",
        data: updatedInterview 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error saving feedback:", error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Interview not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    const errMsg = error instanceof Error ? error.message : "Failed to save feedback";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
