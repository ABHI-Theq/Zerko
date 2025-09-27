import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { InterviewCreationSchema, InterviewType } from "@/types";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import z from "zod";

interface CloudinaryResponse{
    public_id: string;
    [key:string]:any
}

export async function POST(req: Request) {
  const session = await auth();

  try {
    const formData = await req.formData();

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

      const uploadRes = await new Promise<CloudinaryResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              folder: "resumes",
              use_filename: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as CloudinaryResponse);
            }
          )
          .end(buffer);
      });

    
      resumeUrl = uploadRes.secure_url;
      console.log(resumeUrl);
      
    }

    // 🟢 Create interview in DB
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!post || !jobDescription || !interviewType || !duration) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
      console.log();
    }

    const newInterview = await prisma.interview.create({
      data: {
        userId,
        post: post,
        jobDescription: jobDescription,
        interviewType: interviewType as InterviewType,
        startedAt: new Date(),
        resume: resumeUrl,
        duration: Number(duration),
      },
    });

    revalidatePath("/dashboard");

    return NextResponse.json({ interviewDets: newInterview }, { status: 201 });
  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error occurred while creating interview";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
