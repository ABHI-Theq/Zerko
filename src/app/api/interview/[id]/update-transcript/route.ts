import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session=await auth()
  const { messages } = await req.json();
  try {
    if (!id) {
      return NextResponse.json({
        error: "Error fetching slug",
        status: 400,
      });
    }
    if(!session){
      return NextResponse.json({
        error:"Error authenticating the user",
        status:401
      })
    }
    if (!messages) {
      throw new Error("Error while setting up transcript of the interview");
    }
    const interview = await prisma.interview.update({
      where: {
        id: id,
        userId:session?.user?.id
      },
      data: {
        transcript: messages,
      },
    });

    return NextResponse.json({
      status: 200,
      interviewDets: interview,
    });
  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error while setting up transcript";
    return NextResponse.json({
      status: 500,
      error: errMsg,
    });
  }
}
