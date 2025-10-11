# Correct imports based on your files
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Literal

# Import the functions with correct names
from AI_interview_agent import interview_agent_auto_number
from Question_generator_agent import get_questions,parse_Resume
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="AI Interview Agent API")
 
origins = [
    "http://localhost.3000.com",
    "https://localhost.3000.com",
    "http://localhost",
    "http://localhost:8080",
]

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
    resume_url: str
    interview_type: Literal["Technical", "Behavioral", "HR", "Managerial"]
    duration: str  # e.g., "30m"

class InterviewRequest(BaseModel):
    post: str
    job_description: str
    resume_url: str
    interview_type: Literal["Technical", "Behavioral", "HR", "Managerial"]
    duration: str
    questions_list: List[Dict]  # Pre-generated questions
    messages: List[Dict]  # Chat history


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


# ----------------------------
# Generate Questions Endpoint
# ----------------------------
@app.post("/generate/questions")
def generate_questions(req: GenerateQuestionsRequest):
    try:
        # Call the question generator agent
        output = get_questions(
            post=req.post,
            job_description=req.job_description,
            ResumeUrl=req.resume_url,
            interviewType=req.interview_type,
            duration=req.duration
        )
        return {"success": True, "data": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {e}")


# ----------------------------
# Candidate-Facing Interview Endpoint
# ----------------------------
@app.post("/interview/next")
def get_next_interview_question(req: InterviewRequest):
    try:
        # Parse resume content (simplified for interview agent)
        resume_data = parse_Resume(req.resume_url)

        # Call the interview agent with auto-numbering
        result = interview_agent_auto_number.interview_agent_auto_number(
            Post=req.post,
            JobDescription=req.job_description,
            resume_data=resume_data,
            questions_list=req.questions_list,
            messages=req.messages
        )

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during interview: {e}")
    
if __name__=="__main__":
    uvicorn.run(app,host="0.0.0.0",port=8000) 
