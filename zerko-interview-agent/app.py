# app.py
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel,Field
from typing import List, Dict, Literal,Annotated
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Import your modules - make sure module filenames match these imports.
# If your file is named `Question_generator_agent.py` (exact), Python module name is 'Question_generator_agent'
# If you used a different filename, update these imports accordingly.
from Question_generator_agent import get_questions, parse_Resume
# AI_interview_agent should expose a function. Adjust import if your file exports differently.
from AI_interview_agent import interview_agent_auto_number as interview_agent_fn

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Interview Agent API")

# allow origins - include your front-end origin(s)
origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "*"
]
# optionally include environment variable origin if set
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
# Request Schemas
# ----------------------------
class GenerateQuestionsRequest(BaseModel):
    post: str
    job_description: str
    resumeData: str
    interview_type: Literal["TECHNICAL", "BEHAVIORAL", "HR", "SYSTEM_DESIGN"]
    duration: str  # e.g., "30m"


class InterviewRequest(BaseModel):
    post: str
    job_description: str
    resumeData: str
    interview_type: Literal["TECHNICAL", "BEHAVIORAL", "HR", "SYSTEM_DESIGN"]
    duration: str
    questions: List[Dict]  # Pre-generated questions
    messages: List[Dict]  # Chat history

class ParseResume(BaseModel):
    resumeUrl: Annotated[str,Field(description="URL of the resume to be parsed")]

# ----------------------------
# Healthcheck Endpoint
# ----------------------------
@app.get("/")
@app.get("/health")
def healthcheck():
    return {
        "success": True,
        "health": "Working perfectly! API is connected to the Interview Agent."
    }



#-----------------------------
# Resume parsing Endpoint
#-----------------------------
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
# Generate Questions Endpoint
# ----------------------------
@app.post("/api/generate/questions")
def generate_questions(req: GenerateQuestionsRequest):
    try:
        logging.info("Generate questions request received for post: %s", req.post)
        output = get_questions(
            post=req.post,
            job_description=req.job_description,
            resume_data=req.resumeData,
            interviewType=req.interview_type,
            duration=req.duration
        )
        # output should already be a dict with keys 'interview_summary' and 'questions'
        return {"success": True, "data": output}
    except Exception as e:
        logging.exception("Error generating questions")
        raise HTTPException(status_code=500, detail=f"Error generating questions: {e}")


# ----------------------------
# Candidate-Facing Interview Endpoint
# ----------------------------
@app.post("/api/interview/next")
def get_next_interview_question(req: InterviewRequest):
    try:
        logging.info("Interview next request for post: %s", req.post)
        # Parse resume content (simplified for interview agent)

        # Call the interview agent function (ensure your module exposes a callable fn)
        result = interview_agent_fn(
            Post=req.post,
            JobDescription=req.job_description,
            resume_data=req.resumeData,
            questions_list=req.questions,
            messages=req.messages
        )

        return {"success": True, "data": result}
    except Exception as e:
        logging.exception("Error during interview")
        raise HTTPException(status_code=500, detail=f"Error during interview: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
