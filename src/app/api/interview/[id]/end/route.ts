import  {auth} from "@/lib/auth"
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(id);
  
  const session = await auth();

  try {
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interview = await prisma.interview.update({
      where: {
        id: id
      },
      data: { status: "ENDED" }
    });

    return NextResponse.json({
      status: 200,
      success: true,
      interviewDets: interview
    });
  } catch (error) {
    console.error("Error ending interview:", error);
    const errMsg = error instanceof Error ? error.message : "Error while updating interview status";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}