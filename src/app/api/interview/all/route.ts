import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const interviews = await prisma.interview.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Interviews fetched successfully:", {
      userId: session.user.id,
      count: interviews.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        interviews, 
        success: true,
        count: interviews.length 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching interviews:", error);
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error occurred while fetching interviews";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
