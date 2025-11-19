import  {auth} from "@/lib/auth"
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }

    console.log("Ending interview:", id);
    
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const interview = await prisma.interview.delete({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    console.log("Interview ended successfully:", {
      interviewId: id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: true,
        message: "Interview ended successfully",
        interviewDets: id
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error ending interview:", error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Interview not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    const errMsg = error instanceof Error ? error.message : "Error while ending interview";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}