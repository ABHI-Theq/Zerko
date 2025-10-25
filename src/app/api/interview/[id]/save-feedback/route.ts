import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { feedback } = await request.json();
    const {id} =await params;

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        feedback,
        feedbackGenerated: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedInterview });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
