import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Annotated, Optional
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from Question_generator_agent import get_questions, parse_Resume
from AI_interview_agent import interview_agent_auto_number as interview_agent_fn
from FeedBackReportAgent import feedbackReport_agent

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Interview Agent API")

# CORS
origins = ["http://localhost:3000", "http://localhost:8080", "*"]
frontend_origin = os.getenv("NEXT_PUBLIC_URL")
if frontend_origin:
    origins.append(frontend_origin)

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

@app.post("/api/feedback")
def getFeedBackReport(req: FeedBackReportRequestModel):
    """
    POST endpoint that generates a full interview feedback report.
    """

    try:
        report = feedbackReport_agent(
            post=req.post,
            jobDescription=req.jobDescription,
            resume_data=req.resume_data,
            transcript=req.transcript,
            question_list=req.question_list,
            interview_type=req.interview_type,
        )

        return {
            "success": True,
            "message": "Feedback report generated successfully",
            "feedback_report": report,
        }

    except Exception as e:
        logging.error(f"Error generating feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
