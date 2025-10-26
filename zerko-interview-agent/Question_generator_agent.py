# Question_generator_agent.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# --- Ensure API key ---
if not os.getenv("GOOGLE_API_KEY"):
    raise EnvironmentError("Missing GOOGLE_API_KEY in environment variables.")


# ---- Pydantic Model for structured output ----
class Question(BaseModel):
    id: int = Field(..., description="Sequential ID starting from 1 for each question.")
    question: str = Field(..., description="The interview question text.")

class InterviewOutput(BaseModel):
    questions: List[Question] = Field(..., description="List of interview questions.")
    interview_summary: str = Field(..., description="2–3 line summary describing interview focus.")


def parse_Resume(resume_url: str) -> str:
    """Download and extract text from resume PDF, return text content."""
    try:
        resp = requests.get(resume_url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Failed to download resume from {resume_url}: {e}")

    tmp_path = "temp_resume.pdf"
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    try:
        loader = PyMuPDFLoader(tmp_path)
        documents = loader.load()
        if not documents:
            raise RuntimeError("No pages found in resume PDF.")
        page_content = "\n".join([d.page_content for d in documents])
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return page_content


def get_questions(post: str, job_description: str, resume_data: str, interviewType: str, duration: str):
    """Generate structured interview questions using PydanticOutputParser."""
    output_parser = PydanticOutputParser(pydantic_object=InterviewOutput)

    # ---- Prompt Template ----
    prompt = PromptTemplate(
        template="""
You are an **AI Interview Agent** representing a hiring company.
Your responsibility is to evaluate whether the candidate is suitable for the given position and generate relevant interview questions.

**Post:** {post}

Analyze both the **Job Description** and the **Candidate's Resume** carefully.

### Input Details
**Job Description:**
{JobDescription}

**Candidate Resume:**
{resume_data}

**Interview Type:** {interviewType}  
**Duration:** {duration}

---

{format_instructions}
""",
        input_variables=["post", "JobDescription", "resume_data", "interviewType", "duration"],
        partial_variables={"format_instructions": output_parser.get_format_instructions()},
    )

    final_prompt = prompt.format(
        post=post,
        JobDescription=job_description,
        resume_data=resume_data,
        interviewType=interviewType,
        duration=duration,
    )

    # ---- LLM ----
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.7)

    try:
        response = llm.invoke(final_prompt)
    except Exception as e:
        raise RuntimeError(f"LLM invocation failed: {e}")

    # ---- Extract text ----
    if hasattr(response, "content"):
        if isinstance(response.content, list):
            text_output = "".join(
                [chunk.get("text", "") for chunk in response.content if isinstance(chunk, dict)]
            )
        else:
            text_output = str(response.content)
    else:
        text_output = str(response)

    # ---- Parse with Pydantic Parser ----
    try:
        parsed_output = output_parser.parse(text_output)
        return parsed_output.dict()
    except Exception as e:
        raise RuntimeError(
            f"Could not parse structured output from LLM.\n\nRaw output:\n{text_output}\n\nParse error: {e}"
        )


if __name__ == "__main__":
    print("Generating interview questions... please wait...\n")

    resume_text = parse_resume(
        "https://res.cloudinary.com/divvzs1rt/image/upload/v1760377410/resumes/file_ttbg0x.pdf"
    )

    out = get_questions(
        post="Full Stack Developer",
        job_description="""
We are seeking a highly skilled and innovative Full Stack Developer to join our dynamic engineering team.
The ideal candidate will be proficient in modern front-end frameworks (React, Angular, or Vue)
and robust back-end technologies (Node.js, Python, or Java).
""",
        resume_data=resume_text,
        interview_type="TECHNICAL",
        duration="30m",
    )

    print("✅ Output:")
    print(out)
