import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const GET = async () => {
  const requestId = `all_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [API_GET_ALL_RESUMES] ${requestId} - Fetch all resumes request started`);
  
  try {
    console.log(`🔐 [API_GET_ALL_RESUMES] ${requestId} - Checking authentication`);
    const session = await auth();
    if (!session || !session.user) {
      console.log(`❌ [API_GET_ALL_RESUMES] ${requestId} - Authentication failed: No session or user`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`✅ [API_GET_ALL_RESUMES] ${requestId} - Authentication successful for user: ${userId}`);

    console.log(`💾 [API_GET_ALL_RESUMES] ${requestId} - Querying database for all user resumes`);
    const startTime = Date.now();
    const resumes = await prisma.resumeAnalysis.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        userId: true,
        title: true,
        resumeText: true,
        cloudinaryUrl: true,
        jobDescription: true,
        analysisResult: true,
        totalScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`⏱️ [API_GET_ALL_RESUMES] ${requestId} - Database query completed in ${queryTime}ms`);
    console.log(`📊 [API_GET_ALL_RESUMES] ${requestId} - Found ${resumes.length} resumes for user`);
    
    if (resumes.length > 0) {
      const statusCounts = resumes.reduce((acc, resume) => {
        acc[resume.status] = (acc[resume.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`📋 [API_GET_ALL_RESUMES] ${requestId} - Resume status breakdown:`, statusCounts);
    }

    console.log(`✅ [API_GET_ALL_RESUMES] ${requestId} - Sending resumes data to client`);
    return NextResponse.json(resumes, { status: 200 });
  } catch (error) {
    console.error(`❌ [API_GET_ALL_RESUMES] ${requestId} - Error fetching resumes:`, error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    console.error(`❌ [API_GET_ALL_RESUMES] ${requestId} - Error message: ${errMsg}`);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};