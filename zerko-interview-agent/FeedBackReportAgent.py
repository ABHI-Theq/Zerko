import os
import time
import logging
from typing import List, Literal, Optional, Dict, Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---- MODELS ----
class MessageModel(BaseModel):
    role: str
    content: str


class FeedBackOutput(BaseModel):
    feedBackStr: str = Field(..., description="Detailed feedback report for the candidate.")
    overall_rating: int = Field(..., description="Rating the interview completely (1-10).")
    strengths: List[str] = Field(..., description="List of candidate's strengths.")
    improvements: List[str] = Field(..., description="List of areas where the candidate can improve.")


class QuestionModel(BaseModel):
    id: int
    question: str


class FeedBackReportModel(BaseModel):
    post: str
    jobDescription: str
    resume_data: str
    transcript: List[MessageModel]
    question_list: List[QuestionModel]
    interview_type: Literal["TECHNICAL", "HR", "SYSTEM_DESIGN", "BEHAVIORAL"]


# ---- FEEDBACK AGENT ----
def feedbackReport_agent(
    post: str,
    jobDescription: str,
    resume_data: str,
    transcript: List[Dict[str, Any]],
    question_list: List[Dict[str, Any]],
    interview_type: str,
    model_name: Optional[str] = None,
    temperature: float = 0.5,
    max_retries: int = 2,
    retry_backoff_seconds: float = 1.5,
) -> Dict[str, Any]:
    """
    Generates a detailed feedback report for the candidate after the interview.

    Returns a dict:
      {
        "success": bool,
        "parsed": FeedBackOutput | None,
        "raw": str,                 # raw LLM output
        "meta": {...}               # metadata like model, attempts, errors
      }
    """
    # Validate & coerce input via Pydantic model
    try:
        payload = FeedBackReportModel(
            post=post,
            jobDescription=jobDescription,
            resume_data=resume_data,
            transcript=[MessageModel(**m) if not isinstance(m, MessageModel) else m for m in transcript],
            question_list=[QuestionModel(**q) if not isinstance(q, QuestionModel) else q for q in question_list],
            interview_type=interview_type
        )
    except ValidationError as e:
        logger.error("Input validation failed: %s", e)
        return {"success": False, "error": "Input validation failed", "details": e.errors()}


    # Configurable model/temperature via env vars or args
    model_name = os.getenv("FEEDBACK_MODEL", model_name or "gemini-2.5-pro")
    try:
        temperature = float(os.getenv("FEEDBACK_TEMP", temperature))
    except (TypeError, ValueError):
        temperature = 0.5


    logger.info("Generating feedback: post=%s, type=%s, model=%s, temp=%s", payload.post, payload.interview_type, model_name, temperature)

    output_parser = PydanticOutputParser(pydantic_object=FeedBackOutput)

    # Initialize ChatGoogleGenerativeAI with API key read from environment variable GOOGLE_API_KEY
    # The environment must have GOOGLE_API_KEY set before running this script
    llm = ChatGoogleGenerativeAI(model=model_name, temperature=temperature)

    # Convert structured data to readable strings
    transcript_text = "\n".join([f"{msg.role.upper()}: {msg.content}" for msg in payload.transcript])
    questions_text = "\n".join([f"{q.id}. {q.question}" for q in payload.question_list])

    # ---- PROMPT ----
    feedback_prompt = PromptTemplate(
        template="""
You are an expert interview evaluator generating a candidate feedback report.

### Context
- **Job Role:** {post}
- **Interview Type:** {interview_type}
- **Job Description:** {jobDescription}
- **Candidate Resume Summary:** {resume_data}

### Interview Transcript
{transcript}

### Question List
{questions}

---

Now write a **professional feedback report** in this structure:

**1. Candidate Summary**
Short overview of candidate’s background and communication style.

**2. Key Strengths**
List 2–4 strengths from the interview or resume.

**3. Areas for Improvement**
Mention 2–3 areas where the candidate can improve.

**4. Technical/Domain Evaluation**
Evaluate based on role and question relevance.

**5. Communication & Confidence**
Rate clarity, confidence, and articulation on a scale of 1–10.

**6. Overall Recommendation**
Conclude if the candidate is recommended, needs improvement, or not suitable — and why.

**7. Overall Rating**
Provide an overall rating from 1 to 10.

Keep tone objective and concise. Avoid generic fluff.

---

{format_instructions}
""",
        input_variables=["post", "jobDescription", "resume_data", "transcript", "questions", "interview_type"],
        partial_variables={"format_instructions": output_parser.get_format_instructions()},
    )

    formatted_prompt = feedback_prompt.format(
        post=payload.post,
        jobDescription=payload.jobDescription,
        resume_data=payload.resume_data,
        transcript=transcript_text,
        questions=questions_text,
        interview_type=payload.interview_type
    )

    last_error = None
    raw_text = ""
    attempts = 0

    for attempt in range(1, max_retries + 1):
        attempts = attempt
        try:
            response = llm.invoke(formatted_prompt)
            raw_text = getattr(response, "content", str(response)).strip()
            logger.info("LLM response received (attempt %d).", attempt)
            break
        except Exception as e:
            last_error = e
            logger.warning("LLM invocation failed on attempt %d: %s", attempt, e)
            time.sleep(retry_backoff_seconds * attempt)

    if raw_text == "":
        logger.error("LLM invocation failed after %d attempts: %s", attempts, last_error)
        return {
            "success": False,
            "error": "LLM invocation failed",
            "meta": {"model": model_name, "attempts": attempts, "last_error": str(last_error)}
        }

    # Try parsing structured output
    parsed_model: Optional[FeedBackOutput] = None
    parse_error = None
    try:
        parsed_model = output_parser.parse(raw_text)
        # Ensure rating bounds
        if parsed_model.overall_rating < 1:
            parsed_model.overall_rating = 1
        elif parsed_model.overall_rating > 10:
            parsed_model.overall_rating = 10
        logger.info("Successfully parsed feedback into FeedBackOutput.")
    except Exception as e:
        parse_error = e
        logger.warning("Parsing LLM output into FeedBackOutput failed: %s", e)

    result = {
        "success": True,
        "parsed": parsed_model.model_dump() if parsed_model else None,
        "raw": raw_text,
        "meta": {
            "model": model_name,
            "temperature": temperature,
            "attempts": attempts,
            "parse_error": str(parse_error) if parse_error else None
        }
    }

    return result


if __name__ == "__main__":
    sample = FeedBackReportModel(
        post="Software Engineer",
        jobDescription="Develop scalable backend APIs in Python and Node.js",
        resume_data="Experienced in Python, Django, and REST APIs.",
        interview_type="TECHNICAL",
        question_list=[
            QuestionModel(id=1, question="What are Python decorators?"),
            QuestionModel(id=2, question="Explain REST API design principles.")
        ],
        transcript=[
            MessageModel(role="interviewer", content="Can you explain decorators in Python?"),
            MessageModel(role="candidate", content="They are functions that wrap other functions to modify behavior."),
            MessageModel(role="interviewer", content="Good! How about REST APIs?"),
            MessageModel(role="candidate", content="They are architectural principles using HTTP for CRUD operations.")
        ]
    )

    result = feedbackReport_agent(**sample.model_dump())

    if result.get("success"):
        print("=== Parsed Feedback ===")
        if result["parsed"]['overall_rating'] is not None:
            print(result["parsed"]['overall_rating'])
        else:
            print("Parsed output unavailable; raw feedback below.")
        print("\n=== Raw Feedback ===")
        print(result["raw"])
        print("\n=== Meta ===")
        print(result["meta"])
    else:
        print("Error:", result.get("error"))
        if "details" in result:
            print(result["details"])
