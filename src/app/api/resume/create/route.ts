import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { ResumeOptimizationRequestSchema } from "@/types";
import z from "zod";
import { v4 as uuidv4 } from "uuid";
interface CloudinaryResponse {
  public_id: string;
  [key: string]: any;
}
export const POST = async (req: Request) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [API_CREATE] ${requestId} - Resume creation request started`);
  
  try {
    console.log(`🔐 [API_CREATE] ${requestId} - Checking authentication`);
    const session = await auth();
    if (!session || !session.user) {
      console.log(`❌ [API_CREATE] ${requestId} - Authentication failed: No session or user`);
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }
    //get user id from session
    const userId = session.user.id;
    console.log(`✅ [API_CREATE] ${requestId} - Authentication successful for user: ${userId}`);

    //1. Upload Resume file to Cloudinary
    console.log(`📋 [API_CREATE] ${requestId} - Parsing form data`);

    let formData;
    try {
      formData = await req.formData();
      console.log(`✅ [API_CREATE] ${requestId} - Form data parsed successfully`);
    } catch (parseError) {
      console.error(`❌ [API_CREATE] ${requestId} - Error parsing form data:`, parseError);
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    const resumeFile = formData.get("resume") as File | null;
    const JobDescription = formData.get("jobDescription") as string | null;
    const title = formData.get("title") as string | null;

    console.log(`📝 [API_CREATE] ${requestId} - Extracted form fields:`, {
      title: title,
      resumeFileName: resumeFile?.name,
      resumeFileSize: resumeFile?.size,
      jobDescriptionLength: JobDescription?.length
    });

    console.log(`🔍 [API_CREATE] ${requestId} - Validating request with Zod schema`);
    const parsed= ResumeOptimizationRequestSchema.safeParse({
        title: title,
        resume:resumeFile,
        JobDescription:JobDescription
    });
    //validating request using ZOD
    if(!parsed.success){
        console.log(`❌ [API_CREATE] ${requestId} - Validation failed:`, parsed.error);
        return NextResponse.json(
            { error: z.prettifyError(parsed.error) },
            { status: 400 }
          );
    }
    console.log(`✅ [API_CREATE] ${requestId} - Validation passed`);

    //checking if file present or not
    if (!resumeFile) {
      return NextResponse.json(
        {
          error: "Resume file is required",
        },
        {
          status: 400,
        }
      );
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "File size must be less than 5MB" },
            { status: 400 }
          );
        }
    //uploading file to cloudinary
    console.log(`☁️ [API_CREATE] ${requestId} - Starting Cloudinary upload`);

    let resumeUrl: string|null=null;
    const uploadStartTime = Date.now();
    const bytes = await resumeFile.arrayBuffer();
    const buffer=Buffer.from(bytes);
    
    console.log(`📤 [API_CREATE] ${requestId} - Uploading ${buffer.length} bytes to Cloudinary`);
    
    const uploadRes = await new Promise<CloudinaryResponse>(
            (resolve, reject) => {
              cloudinary.uploader
                .upload_stream(
                  {
                    resource_type: "auto",
                    folder: "resumes_ops",
                    use_filename: true,
                  },
                  (error, result) => {
                    if (error) {
                      console.log(`❌ [API_CREATE] ${requestId} - Cloudinary upload failed:`, error);
                      reject(error);
                    } else {
                      console.log(`✅ [API_CREATE] ${requestId} - Cloudinary upload successful`);
                      resolve(result as CloudinaryResponse);
                    }
                  }
                )
                .end(buffer);
            }
          );
    
    const uploadTime = Date.now() - uploadStartTime;
    resumeUrl = uploadRes.secure_url;
    console.log(`☁️ [API_CREATE] ${requestId} - Resume uploaded to Cloudinary in ${uploadTime}ms:`, resumeUrl);
    resumeUrl = resumeUrl?.replace("/upload/", "/upload/f_jpg/") as string;
    console.log(`🔄 [API_CREATE] ${requestId} - Modified URL for processing:`, resumeUrl);

    //2. saving the Resume Analysis to DB
    console.log(`💾 [API_CREATE] ${requestId} - Creating resume record in database`);
    const resumeId = uuidv4();
    console.log(`🆔 [API_CREATE] ${requestId} - Generated resume ID: ${resumeId}`);
    
    const newResume=await prisma.resumeAnalysis.create({
      data:{
        id: resumeId,
        title: title as string,
        userId:userId as string,
        resumeText:"",
        cloudinaryUrl:resumeUrl as string,
        jobDescription: JobDescription as string,
        totalScore:0,
        status:"PROCESSING",
        updatedAt: new Date()
      }
    })
    
    console.log(`✅ [API_CREATE] ${requestId} - Resume record created with status: PROCESSING`);

   // 3. Trigger Python API with strong fallback logic
    const pythonApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
    console.log(`🐍 [API_CREATE] ${requestId} - Python API URL: ${pythonApiUrl}`);
    
    if (pythonApiUrl) {
      try {
        console.log(`📤 [API_CREATE] ${requestId} - Sending request to Python API /api/analysis`);
        const pythonPayload = {
          resumeId: newResume.id,
          fileUrl: resumeUrl,
          JobDescription: JobDescription,
        };
        console.log(`📋 [API_CREATE] ${requestId} - Python API payload:`, pythonPayload);
        
        const pythonStartTime = Date.now();
        const pythonRes = await fetch(`${pythonApiUrl}/api/analysis`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pythonPayload),
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        const pythonResponseTime = Date.now() - pythonStartTime;
        console.log(`⏱️ [API_CREATE] ${requestId} - Python API responded in ${pythonResponseTime}ms`);

        if (!pythonRes.ok) {
          const errorText = await pythonRes.text();
          console.error(`❌ [API_CREATE] ${requestId} - Python API Error (${pythonRes.status}):`, errorText);
          throw new Error(`Python API returned ${pythonRes.status}: ${errorText}`);
        } else {
          const pythonData = await pythonRes.json();
          console.log(`✅ [API_CREATE] ${requestId} - Python API success:`, pythonData);
        }
      } catch (fetchError) {
        console.error(`❌ [API_CREATE] ${requestId} - Failed to connect to Python API:`, fetchError);
        
        // STRONG FALLBACK: Update status to FAILED immediately
        console.log(`🔄 [API_CREATE] ${requestId} - Implementing fallback: updating status to FAILED`);
        try {
          await prisma.resumeAnalysis.update({
            where: { id: newResume.id },
            data: { 
              status: "FAILED",
              updatedAt: new Date()
            }
          });
          console.log(`✅ [API_CREATE] ${requestId} - Status updated to FAILED due to Python API connection error`);
        } catch (dbError) {
          console.error(`❌ [API_CREATE] ${requestId} - Failed to update status to FAILED:`, dbError);
        }
        
        // Log the specific error type for better debugging
        if (fetchError instanceof Error) {
          if (fetchError.message.includes('ECONNREFUSED')) {
            console.error(`❌ [API_CREATE] ${requestId} - Python API server is not running (ECONNREFUSED)`);
          } else if (fetchError.message.includes('timeout')) {
            console.error(`❌ [API_CREATE] ${requestId} - Python API request timed out`);
          } else {
            console.error(`❌ [API_CREATE] ${requestId} - Python API error: ${fetchError.message}`);
          }
        }
      }
    } else {
      console.error(`❌ [API_CREATE] ${requestId} - NEXT_PUBLIC_AGENT_API_URL is not defined`);
      
      // STRONG FALLBACK: Update status to FAILED when no API URL
      console.log(`🔄 [API_CREATE] ${requestId} - No Python API URL configured, updating status to FAILED`);
      try {
        await prisma.resumeAnalysis.update({
          where: { id: newResume.id },
          data: { 
            status: "FAILED",
            updatedAt: new Date()
          }
        });
        console.log(`✅ [API_CREATE] ${requestId} - Status updated to FAILED due to missing Python API URL`);
      } catch (dbError) {
        console.error(`❌ [API_CREATE] ${requestId} - Failed to update status to FAILED:`, dbError);
      }
    }

    //4. sending response to the frontend 
    console.log(`✅ [API_CREATE] ${requestId} - Sending success response to frontend`);
    const response = {
      success: true,     
      resumeId: newResume.id
    };
    console.log(`📤 [API_CREATE] ${requestId} - Response:`, response);
    
    return NextResponse.json(response, {
      status: 200
    })

  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error Occcured while optimizing Resume";
    console.error(`❌ [API_CREATE] ${requestId} - Fatal error:`, error);
    console.error(`❌ [API_CREATE] ${requestId} - Error message:`, errMsg);
    
    return NextResponse.json(
      {
        error: errMsg,
      },
      {
        status: 500,
      }
    );
  }
};
