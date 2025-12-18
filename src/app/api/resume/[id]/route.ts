import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const requestId = `get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [API_GET_RESUME] ${requestId} - Resume fetch request started`);
  
  try {
    console.log(`🔐 [API_GET_RESUME] ${requestId} - Checking authentication`);
    const session = await auth();
    if (!session || !session.user) {
      console.log(`❌ [API_GET_RESUME] ${requestId} - Authentication failed: No session or user`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const {id} = await params;
    console.log(`✅ [API_GET_RESUME] ${requestId} - Authentication successful for user: ${userId}, resumeId: ${id}`);

    console.log(`💾 [API_GET_RESUME] ${requestId} - Querying database for resume`);
    const startTime = Date.now();
    const resume = await prisma.resumeAnalysis.findFirst({
      where: {
        id: id,
        userId: userId,
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
    console.log(`⏱️ [API_GET_RESUME] ${requestId} - Database query completed in ${queryTime}ms`);

    if (!resume) {
      console.log(`❌ [API_GET_RESUME] ${requestId} - Resume not found for id: ${id}, userId: ${userId}`);
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    console.log(`📊 [API_GET_RESUME] ${requestId} - Resume found:`, {
      id: resume.id,
      title: resume.title,
      status: resume.status,
      totalScore: resume.totalScore,
      hasAnalysisResult: !!resume.analysisResult,
      resumeTextLength: resume.resumeText?.length || 0
    });

    console.log(`✅ [API_GET_RESUME] ${requestId} - Sending resume data to client`);
    return NextResponse.json(resume, { status: 200 });
  } catch (error) {
    console.error(`❌ [API_GET_RESUME] ${requestId} - Error fetching resume:`, error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    console.error(`❌ [API_GET_RESUME] ${requestId} - Error message: ${errMsg}`);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const requestId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [API_DELETE_RESUME] ${requestId} - Resume deletion request started`);
  
  try {
    console.log(`🔐 [API_DELETE_RESUME] ${requestId} - Checking authentication`);
    const session = await auth();
    if (!session || !session.user) {
      console.log(`❌ [API_DELETE_RESUME] ${requestId} - Authentication failed: No session or user`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const {id} = await params;
    console.log(`✅ [API_DELETE_RESUME] ${requestId} - Authentication successful for user: ${userId}, resumeId: ${id}`);

    console.log(`🔍 [API_DELETE_RESUME] ${requestId} - Checking if resume exists and belongs to user`);
    // Check if resume exists and belongs to user
    const existingResume = await prisma.resumeAnalysis.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingResume) {
      console.log(`❌ [API_DELETE_RESUME] ${requestId} - Resume not found for id: ${id}, userId: ${userId}`);
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    console.log(`📋 [API_DELETE_RESUME] ${requestId} - Resume found, proceeding with deletion:`, {
      id: existingResume.id,
      title: existingResume.title,
      status: existingResume.status
    });

    // Delete the resume
    console.log(`🗑️ [API_DELETE_RESUME] ${requestId} - Executing database deletion`);
    const deleteStartTime = Date.now();
    await prisma.resumeAnalysis.delete({
      where: {
        id: id,
      },
    });
    const deleteTime = Date.now() - deleteStartTime;

    console.log(`✅ [API_DELETE_RESUME] ${requestId} - Resume deleted successfully in ${deleteTime}ms: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Resume deleted successfully",
        resumeId: id
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`❌ [API_DELETE_RESUME] ${requestId} - Error deleting resume:`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      console.log(`❌ [API_DELETE_RESUME] ${requestId} - Prisma error: Resume not found (P2025)`);
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    const errMsg = error instanceof Error ? error.message : "Error deleting resume";
    console.error(`❌ [API_DELETE_RESUME] ${requestId} - Error message: ${errMsg}`);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const requestId = `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [API_PATCH_RESUME] ${requestId} - Resume update request started`);
  
  try {
    console.log(`🔐 [API_PATCH_RESUME] ${requestId} - Checking authentication`);
    const session = await auth();
    if (!session || !session.user) {
      console.log(`❌ [API_PATCH_RESUME] ${requestId} - Authentication failed: No session or user`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();
    
    console.log(`✅ [API_PATCH_RESUME] ${requestId} - Authentication successful for user: ${userId}, resumeId: ${id}`);
    console.log(`📋 [API_PATCH_RESUME] ${requestId} - Update data:`, body);

    // Validate that resume exists and belongs to user
    const existingResume = await prisma.resumeAnalysis.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingResume) {
      console.log(`❌ [API_PATCH_RESUME] ${requestId} - Resume not found for id: ${id}, userId: ${userId}`);
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    console.log(`💾 [API_PATCH_RESUME] ${requestId} - Updating resume in database`);
    const updateStartTime = Date.now();
    
    const updatedResume = await prisma.resumeAnalysis.update({
      where: { id: id },
      data: {
        ...body,
        updatedAt: new Date()
      },
    });
    
    const updateTime = Date.now() - updateStartTime;
    console.log(`⏱️ [API_PATCH_RESUME] ${requestId} - Database update completed in ${updateTime}ms`);
    console.log(`✅ [API_PATCH_RESUME] ${requestId} - Resume updated successfully:`, {
      id: updatedResume.id,
      status: updatedResume.status,
      totalScore: updatedResume.totalScore
    });

    return NextResponse.json(updatedResume, { status: 200 });
  } catch (error) {
    console.error(`❌ [API_PATCH_RESUME] ${requestId} - Error updating resume:`, error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    console.error(`❌ [API_PATCH_RESUME] ${requestId} - Error message: ${errMsg}`);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};