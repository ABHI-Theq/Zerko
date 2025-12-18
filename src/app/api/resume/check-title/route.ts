import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const POST = async (req: Request) => {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if title already exists for this user
    const existingResume = await prisma.resumeAnalysis.findFirst({
      where: {
        userId: session.user.id,
        title: title.trim(),
      },
      select: {
        id: true,
        title: true,
      }
    });

    return NextResponse.json({
      exists: !!existingResume,
      message: existingResume 
        ? `A resume with the title "${title}" already exists` 
        : "Title is available"
    });

  } catch (error) {
    console.error("Error checking title:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};