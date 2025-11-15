import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { feedback } = await request.json();
    const session=await auth();
    console.log(session);
    
    const {id} =await params;

    const updatedInterview = await prisma.interview.update({
      where: { 
        id:id,
        userId:session?.user?.id
       },
      data: {
        feedbackStr:feedback.feedBackStr,
        overall_rating:feedback.overall_rating,
        strengths:feedback.strengths,
        improvements:feedback.improvements,
        feedbackGenerated: true,
      },
    });
    console.log("feedback saved");
    

    return NextResponse.json({ success: true, data: updatedInterview });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
