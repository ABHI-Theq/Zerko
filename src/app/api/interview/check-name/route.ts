import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: "Invalid name" },
        { status: 400 }
      );
    }

    const existingInterview = await prisma.interview.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim(),
      },
    });

    if (existingInterview) {
      return NextResponse.json({
        exists: true,
        message: "An interview with this name already exists",
      });
    }

    return NextResponse.json({
      exists: false,
      message: "Name is available",
    });
  } catch (error) {
    console.error("Error checking interview name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
