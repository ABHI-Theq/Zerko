from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
from typing import List, Literal
import logging

logging.basicConfig(level=logging.INFO)

# ---- MODELS ----
class MessageModel(BaseModel):
    role: str
    content: str

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
    transcript: List[MessageModel],
    question_list: List[QuestionModel],
    interview_type: str
):
    """
    Generates a detailed feedback report for the candidate after the interview.
    - Evaluates communication, technical/HR knowledge, confidence, and overall suitability.
    - Uses the transcript and resume to generate personalized insights.
    """

    logging.info(f"Generating feedback report for {post} ({interview_type})")

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.5)

    # Convert structured data to readable strings
    transcript_text = "\n".join(
        [f"{msg.role.upper()}: {msg.content}" for msg in transcript]
    )
    questions_text = "\n".join(
        [f"{q.id}. {q.question}" for q in question_list]
    )

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

Keep tone objective and concise. Avoid generic fluff.
""",
        input_variables=["post", "jobDescription", "resume_data", "transcript", "questions", "interview_type"]
    )

    formatted_prompt = feedback_prompt.format(
        post=post,
        jobDescription=jobDescription,
        resume_data=resume_data,
        transcript=transcript_text,
        questions=questions_text,
        interview_type=interview_type
    )

    response = llm.invoke(formatted_prompt)
    feedback_text = response.content.strip()

    return {
        "success": True,
        "feedbackReport": feedback_text
    }

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

    result = feedbackReport_agent(**sample.dict())
    print(result["feedbackReport"])

