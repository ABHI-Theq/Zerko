import uvicorn
from fastapi import FastAPI, HTTPException,BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Annotated, Optional
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma
import os
import logging
import time
from dotenv import load_dotenv
load_dotenv()
from Question_generator_agent import get_questions, parse_Resume
from AI_interview_agent import interview_agent_auto_number as interview_agent_fn
from FeedBackReportAgent import feedbackReport_agent
from service import process_resume_analysis
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db=Prisma()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    logging.info("Connected to DB")
    yield
    await db.disconnect()
    logging.info("Disconnected to DB")

app = FastAPI(title="AI Interview Agent API",lifespan=lifespan)

# CORS
# Build origins list and filter out falsy values; keep wildcard only if explicitly set
raw_origins = [os.getenv("CORS_ORIGIN")]
frontend_origin = os.getenv("NEXT_PUBLIC_URL")
if frontend_origin:
    raw_origins.append(frontend_origin)
# optionally allow wildcard if env var explicitly set to "*"
allow_wildcard = os.getenv("CORS_ALLOW_ALL", "false").lower() in ("1", "true", "yes")
origins = [o for o in raw_origins if o]
if allow_wildcard:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Schemas
# ----------------------------
class MessageModel(BaseModel):
    role: str
    content: str


class QuestionModel(BaseModel):
    id: int
    question: str


class FeedBackReportRequestModel(BaseModel):
    post: str
    jobDescription: str
    resume_data: str
    transcript: List[MessageModel]
    question_list: List[QuestionModel]
    interview_type: Literal["TECHNICAL", "HR", "SYSTEM_DESIGN", "BEHAVIORAL"]


class GenerateQuestionsRequest(BaseModel):
    post: str
    job_description: str
    resumeData: str
    interview_type: Literal["TECHNICAL", "BEHAVIORAL", "HR", "SYSTEM_DESIGN"]
    duration: str  # e.g., "10m"

class InterviewRequest(BaseModel):
    post: str
    job_description: str
    resumeData: str
    interview_type: Literal["TECHNICAL", "BEHAVIORAL", "HR", "SYSTEM_DESIGN"]
    questions: List[Dict]
    messages: List[Dict]
    time_left: Optional[int] = None  # milliseconds remaining
    force_next: Optional[bool] = False

class ParseResume(BaseModel):
    resumeUrl: Annotated[str, Field(description="URL of the resume to be parsed")]

class ResumeAnalysisRequest(BaseModel):
    resumeId: Annotated[str,Field(description="Id of the resume for analysis")]
    fileUrl: Annotated[str,Field(description="URL of the resume file")]
    JobDescription: Annotated[str,Field(description="Details about the Job Role")]




# ----------------------------
# Healthcheck
# ----------------------------
@app.get("/")
@app.get("/health")
def healthcheck():
    return {"success": True, "health": "Working perfectly! API connected."}

# ----------------------------
# Resume parsing
# ----------------------------
@app.post("/api/parse")
def get_resume_data(req: ParseResume):
    try:
        logging.info("Parsing resume: %s", req.resumeUrl)
        data = parse_Resume(req.resumeUrl)
        return {"success": True, "resumeData": data}
    except Exception as e:
        logging.exception("Error parsing resume")
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {e}")

# ----------------------------
# Generate questions
# ----------------------------
@app.post("/api/generate/questions")
def generate_questions(req: GenerateQuestionsRequest):
    try:
        logging.info(f"Generating questions for post: {req.post}")
        output = get_questions(
            post=req.post,
            job_description=req.job_description,
            resume_data=req.resumeData,
            interviewType=req.interview_type,
            duration=req.duration
        )
        return {"success": True, "data": output}
    except Exception as e:
        logging.exception("Error generating questions")
        raise HTTPException(status_code=500, detail=f"Error generating questions: {e}")

# ----------------------------
# Interview Flow
# ----------------------------
@app.post("/api/interview/next")
def get_next_interview_question(req: InterviewRequest):
    try:
        logging.info("Interview request received for post: %s", req.post)
        result = interview_agent_fn(
            Post=req.post,
            JobDescription=req.job_description,
            resume_data=req.resumeData,
            questions_list=req.questions,
            messages=req.messages,
            time_left=req.time_left,
            force_next=req.force_next
        )
        return {"success": True, "data": result}
    except Exception as e:
        logging.exception("Error during interview")
        raise HTTPException(status_code=500, detail=f"Error during interview: {e}")

@app.post("/api/feedback/{interview_id}")
async def generate_interview_feedback(interview_id: str, req: FeedBackReportRequestModel):
    """
    POST endpoint that generates and returns interview feedback.
    Uses feedbackReport_agent which returns a dict with keys:
      - success (bool)
      - parsed (optional structured dict)
      - raw (raw string)
      - meta (metadata)
    """
    try:
        # Log feedback generation request with interview ID (Requirement 9.5)
        logger.info("Feedback generation request received: interview_id=%s, post='%s', type=%s, transcript_length=%d", 
                    interview_id, req.post, req.interview_type, len(req.transcript))

        feedback_result = feedbackReport_agent(
            post=req.post,
            jobDescription=req.jobDescription,
            resume_data=req.resume_data,
            transcript=[m.dict() if hasattr(m, "dict") else m for m in req.transcript],
            question_list=[q.dict() if hasattr(q, "dict") else q for q in req.question_list],
            interview_type=req.interview_type,
        )
    except Exception as e:
        logger.exception("Unhandled error while generating feedback for interview %s", interview_id)
        raise HTTPException(status_code=500, detail="Internal server error")

    if not feedback_result.get("success"):
        # Provide useful error details when available
        detail = feedback_result.get("error") or feedback_result.get("meta") or "Failed to generate feedback"
        logger.error("Feedback agent failed for interview %s: %s", interview_id, detail)
        raise HTTPException(status_code=500, detail=detail)

    # Build response: prefer parsed structured output when available
    parsed = feedback_result.get("parsed")
    raw = feedback_result.get("raw")
    meta = feedback_result.get("meta", {})

    response_payload = {
        "success": True,
        "message": "Feedback generated successfully",
        "interview_id": interview_id,
        "feedback": parsed if parsed else {"raw": raw},
        "meta": meta,
    }
    
    # Log feedback generation completion with interview ID (Requirement 9.5)
    logger.info("Feedback generation completed successfully: interview_id=%s, post='%s', overall_rating=%s", 
                interview_id, req.post, 
                parsed.get("overall_rating") if parsed else "N/A")

    return response_payload

# ----------------------------
# ANALYSIS ROUTE (ASYNC)
# ----------------------------
@app.post("/api/analysis")
async def analyze(req: ResumeAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Receives request -> Starts Background Task -> Returns Immediately.
    """
    request_id = f"py_req_{int(time.time())}_{req.resumeId[:8]}"
    logger.info(f"🚀 [PYTHON_API] {request_id} - Analysis request received")
    logger.info(f"📋 [PYTHON_API] {request_id} - Request details: resumeId={req.resumeId}, fileUrl={req.fileUrl[:50]}..., jobDescLength={len(req.JobDescription)}")
    
    if not req.resumeId or not req.fileUrl:
        logger.error(f"❌ [PYTHON_API] {request_id} - Missing required fields: resumeId={bool(req.resumeId)}, fileUrl={bool(req.fileUrl)}")
        raise HTTPException(status_code=400, detail="Missing resumeId or fileUrl")

    # Fire and Forget
    fileUrl = req.fileUrl.replace("/upload/f_jpg/", "/upload/")
    logger.info(f"🔄 [PYTHON_API] {request_id} - Modified fileUrl: {fileUrl}")
    logger.info(f"🔥 [PYTHON_API] {request_id} - Adding background task for processing")
    
    background_tasks.add_task(
        process_resume_analysis,
        req.resumeId,
        fileUrl,
        req.JobDescription
    )

    response = {
        "success": True,
        "message": "Analysis started in background",
        "resumeId": req.resumeId,
        "status": "PROCESSING"
    }
    logger.info(f"✅ [PYTHON_API] {request_id} - Returning immediate response: {response}")
    return response



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
