from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_community.document_loaders import PyMuPDFLoader
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from typing import List, Dict
import requests
import os
from dotenv import load_dotenv
load_dotenv()


def get_questions(post:str ,job_description: str, ResumeUrl: str, interviewType: str, duration: str):
    # ---- Define structured output schema ----
    response_schemas = [
        ResponseSchema(
            name="questions",
            description="A list of interview questions in structured JSON format. Each element must contain an 'id' and a 'question'."
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
    - `"id"`: an incremental number (starting from 1)
    - `"question"`: the interview question text

    Also include an `"interview_summary"` field describing what the interview will focus on (2–3 lines summary).

    ---

    ### Example Output:
    {{
    "interview_summary": "This interview focuses on evaluating the candidate’s experience with full-stack development, understanding of scalable web applications, and familiarity with modern frameworks and cloud platforms.",
    "questions": [
        {{
        "id": 1,
        "question": "Can you describe a challenging web application you built end-to-end, and what design decisions you made?"
        }},
        {{
        "id": 2,
        "question": "How would you ensure high availability and fault tolerance for a cloud-hosted backend service?"
        }}
    ]
    }}
    """,
        input_variables=["post", "JobDescription", "resume_data", "interviewType", "duration"],
        partial_variables={
            "format_instructions": output_parser.get_format_instructions()
        }
    )

    # ---- Load Resume ----
    resume_data = parse_Resume(ResumeUrl)

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

    response = llm.invoke(final_prompt)

    # ---- Parse Structured Output ----
    try:
        parsed_output = output_parser.parse(response.content)
        print(type(parsed_output))
        print("\n✅ Structured Interview Questions Generated:\n")
        for q in parsed_output["questions"]:
            print(f"{q['id']}. {q['question']}")
    except Exception as e:
        print("\n⚠️ Could not parse structured output, showing raw response instead:\n")
        print(response.content)


def parse_Resume(resumeUrl: str):
    """Download and extract text from resume PDF."""
    response = requests.get(resumeUrl)
    with open("temp.pdf", "wb") as f:
        f.write(response.content)

    loader = PyMuPDFLoader("temp.pdf", mode="single")
    documents = loader.load()

    # Clean up temp file
    if os.path.exists("temp.pdf"):
        os.remove("temp.pdf")
        print("temp.pdf has been deleted.")

    return documents[0].page_content


if __name__ == "__main__":
    print("Generating interview questions... please wait...\n")
    get_questions(
        post="Full stack developer",
        job_description="""
We are seeking a highly skilled and innovative Full Stack Developer to join our dynamic engineering team at a company that thrives on cutting-edge technology and large-scale impact, similar to Google. The ideal candidate will be proficient in designing, developing, and deploying scalable web applications using modern front-end frameworks (such as React, Angular, or Vue) and robust back-end technologies (such as Node.js, Python, or Java). You will collaborate closely with cross-functional teams to build seamless user experiences, optimize system performance, and implement efficient, secure APIs. A strong foundation in cloud platforms (like Google Cloud or AWS), databases (SQL/NoSQL), and DevOps practices is essential. If you are passionate about solving complex problems, writing clean and maintainable code, and contributing to products that reach millions of users worldwide, we’d love to have you on our team.
""",
        ResumeUrl="https://res.cloudinary.com/divvzs1rt/image/upload/v1760166833/resumes/file_sorwxe.pdf",
        interviewType="Technical",
        duration="30m"
    )
