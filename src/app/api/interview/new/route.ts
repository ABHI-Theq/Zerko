import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { InterviewCreationSchema, InterviewType } from "@/types";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import z from "zod";
import {v4 as uuidv4} from "uuid"

interface CloudinaryResponse {
  public_id: string;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Parse form data
    let formData;
    try {
      formData = await req.formData();
    } catch (parseError) {
      console.error("Error parsing form data:", parseError);
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const post = formData.get("post") as string | null;
    const jobDescription = formData.get("jobDescription") as string | null;
    const interviewType = formData.get("interviewType") as InterviewType;
    const duration = formData.get("duration") as string | null;
    const resume = formData.get("resume") as File | null;

    // ✅ Validate non-file fields with Zod
    const parsed = InterviewCreationSchema.safeParse({
      post,
      jobDescription,
      resume,
      interviewType: interviewType as InterviewType,
      duration: duration ? Number(duration) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.prettifyError(parsed.error) },
        { status: 400 }
      );
    }

    // ✅ Validate resume separately
    if (!resume) {
      return NextResponse.json(
        { error: "Resume is required" },
        { status: 400 }
      );
    }

    if (
      ![
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(resume.type)
    ) {
      return NextResponse.json(
        { error: "Only PDF, DOC, or DOCX files are allowed" },
        { status: 400 }
      );
    }

    if (resume.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    let resumeUrl: string | null = null;
    if (resume) {
      const bytes = await resume.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadRes = await new Promise<CloudinaryResponse>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "auto",
                folder: "resumes",
                use_filename: true,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as CloudinaryResponse);
              }
            )
            .end(buffer);
        }
      );

      resumeUrl = uploadRes.secure_url;
      console.log(resumeUrl);

      resumeUrl = resumeUrl?.replace("/upload/", "/upload/f_jpg/") as string;
    }

    // 🟢 Create interview in DB
    const userId = session.user.id;

    if (!post || !jobDescription || !interviewType || !duration) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const newInterview = await prisma.interview.create({
      data: {
        id:uuidv4(), 
        userId,
        post: post,
        jobDescription: jobDescription,
        interviewType: interviewType as InterviewType,
        startedAt: new Date(Date.now()+5.5*60*60*1000),
        resume: resumeUrl,
        duration: Number(duration),
        updatedAt: new Date()
      },
    });

    console.log("Interview created successfully:", {
      interviewId: newInterview.id,
      userId: userId,
      timestamp: new Date().toISOString()
    });

    revalidatePath("/dashboard");

    return NextResponse.json(
      { 
        interviewDets: newInterview,
        success: true,
        message: "Interview created successfully"
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating interview:", error);
    
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error occurred while creating interview";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
