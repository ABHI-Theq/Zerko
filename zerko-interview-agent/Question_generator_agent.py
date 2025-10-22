# Question_generator_agent.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.output_parsers import StructuredOutputParser, ResponseSchema
from typing import List, Dict
import requests
import os
from dotenv import load_dotenv
load_dotenv()

def parse_Resume(resumeUrl: str) -> str:
    """Download and extract text from resume PDF, return text content."""
    try:
        resp = requests.get(resumeUrl, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Failed to download resume from {resumeUrl}: {e}")

    tmp_path = "temp_resume.pdf"
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    try:
        loader = PyMuPDFLoader(tmp_path, mode="single")
        documents = loader.load()
        if not documents:
            raise RuntimeError("No pages found in resume PDF")
        page_content = documents[0].page_content
    finally:
        # always remove temp file
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

    return page_content


def get_questions(post: str, job_description: str, resume_data: str, interviewType: str, duration: str):
    # ---- Define structured output schema ----
    response_schemas = [
        ResponseSchema(
            name="questions",
            description="A list of interview questions in structured JSON format. Each element must contain an 'id' and a 'question'."
        ),
        ResponseSchema(
            name="interview_summary",
            description="Short 2-3 line interview summary describing focus of interview"
        )
    ]

    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    # ---- Optimized Prompt ----
    prompt = PromptTemplate(
        template="""
You are an **AI Interview Agent** representing a hiring company. 
Your responsibility is to evaluate whether the candidate is suitable for the given position and generate relevant interview questions for assessment.

You will act as a professional interviewer conducting an interview **on behalf of the company** for the following post:

**Post:** {post}

Analyze both the **Job Description** and the **Candidate's Resume** carefully to understand the skills, experience, and role expectations. 
Based on that analysis, generate a well-balanced set of questions that will help evaluate the candidate’s fit for the role.

### Evaluation Objectives:
- Assess whether the candidate’s experience and skills align with the company’s requirements.
- Evaluate both technical and behavioral aspects as per the **Interview Type**.
- Ensure questions can be reasonably answered within the specified **Interview Duration**.
- Maintain a professional tone throughout, as if you are a real interviewer representing the company.
- Start from foundational or introductory questions and progress to deeper, analytical, or situational ones.

---

### Input Details

**Job Description:**
{JobDescription}

**Candidate Resume:**
{resume_data}

**Interview Type:** {interviewType}  
**Duration:** {duration}

---

### Output Format (Strict JSON)
You must return your output in the exact format given below.

{format_instructions}

Each question object **must** contain:
- "id": an incremental number (starting from 1)
- "question": the interview question text

Also include an "interview_summary" field describing what the interview will focus on (2–3 lines summary).

---
""",
        input_variables=["post", "JobDescription", "resume_data", "interviewType", "duration"],
        partial_variables={
            "format_instructions": output_parser.get_format_instructions()
        }
    )


    # ---- Final Prompt ----
    final_prompt = prompt.format(
        post=post,
        JobDescription=job_description,
        resume_data=resume_data,
        interviewType=interviewType,
        duration=duration
    )

    # ---- LLM ----
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.7)

    # Try to call the LLM robustly (support different wrappers)
    try:
        response=llm.invoke(final_prompt)
    except Exception as e:
        raise RuntimeError(f"LLM invocation failed: {e}")

    # extract text content from response object
    if isinstance(response, str):
        text_output = response
    else:
        # prefer 'content' attribute, then 'text', then str()
        text_output = response.content

    # ---- Parse Structured Output ----
    try:
        parsed_output = output_parser.parse(text_output)
        # Ensure we return a plain serializable dict with keys interview_summary and questions
        # parsed_output likely already is dict-like
        return {
            "interview_summary": parsed_output.get("interview_summary"),
            "questions": parsed_output.get("questions")
        }
    except Exception as e:
        # Show raw output for debugging and raise a helpful error
        raise RuntimeError(f"Could not parse structured output from LLM. Raw output:\n{text_output}\n\nParse error: {e}")


if __name__ == "__main__":
    print("Generating interview questions... please wait...\n")
    out = get_questions(
        post="Full stack developer",
        job_description="""
We are seeking a highly skilled and innovative Full Stack Developer to join our dynamic engineering team at a company that thrives on cutting-edge technology and large-scale impact, similar to Google. The ideal candidate will be proficient in designing, developing, and deploying scalable web applications using modern front-end frameworks (such as React, Angular, or Vue) and robust back-end technologies (such as Node.js, Python, or Java). You will collaborate closely with cross-functional teams to build seamless user experiences, optimize system performance, and implement efficient, secure APIs. A strong foundation in cloud platforms (like Google Cloud or AWS), databases (SQL/NoSQL), and DevOps practices is essential. If you are passionate about solving complex problems, writing clean and maintainable code, and contributing to products that reach millions of users worldwide, we’d love to have you on our team.
""",
        ResumeUrl="https://res.cloudinary.com/divvzs1rt/image/upload/v1760377410/resumes/file_ttbg0x.pdf",
        interviewType="TECHNICAL",
        duration="30m"
    )
    print("Output:", out)
