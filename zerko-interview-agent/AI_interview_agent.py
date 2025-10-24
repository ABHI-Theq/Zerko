# AI_interview_agent.py

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import logging
load_dotenv()


def interview_agent_auto_number(
    Post: str,
    JobDescription: str,
    resume_data: str,
    questions_list: list,
    messages: list,
    time_left: int = None,
    force_next: bool = False
):
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.6)
    LAST_QUESTION_THRESHOLD = 2 * 60 * 1000
    END_INTERVIEW_THRESHOLD = 30 * 1000

    asked_question_ids = [
        int(m.get("question_id", -1))
        for m in messages
        if m["role"] == "interviewer" and "question_id" in m
    ]
    next_question_idx = len(asked_question_ids) if asked_question_ids else 0
    next_question_obj = (
        questions_list[next_question_idx] if next_question_idx < len(questions_list) else None
    )
    next_question = next_question_obj["question"] if next_question_obj else None

    if not messages:
        return {
            "AIResponse": f"Welcome to the interview for {Post}! Let’s begin!\n\n{questions_list[0]['question']}",
            "endInterview": False,
            "question_id": questions_list[0].get("id") if "id" in questions_list[0] else 0,
            "lastQuestion": False
        }

    end_interview = False
    extra_note = ""
    last_question = False

    if time_left is not None:
        if time_left <= END_INTERVIEW_THRESHOLD:
            end_interview = True
            extra_note = (
                "\n\nThis concludes our interview. "
                "Thank you for your time and thoughtful answers! We will get back to you soon."
            )
        elif time_left <= LAST_QUESTION_THRESHOLD:
            last_question = True
            extra_note = "\n\nWe are approaching the end, this will be your final question."

    if force_next and next_question:
        response_text = next_question + extra_note
        response_id = next_question_obj.get("id") if next_question_obj and "id" in next_question_obj else next_question_idx
    else:
        recent_messages = messages[-5:] if len(messages) > 5 else messages
        prompt_template = PromptTemplate(
            template="""
You are a professional interviewer.
Be polite, concise, and engaging.
You can ask the next question from the predefined list or a follow-up based on candidate's previous answer.
Do not include analysis or commentary, only what should be spoken to the candidate.

Post: {post}
Job Description: {JobDescription}
Candidate Resume: {resume_data}
Ordered Question List:
{questions_list}
Chat History:
{messages}

Next line (what interviewer should say):
""",
            input_variables=["post", "JobDescription", "resume_data", "questions_list", "messages"]
        )
        formatted_prompt = prompt_template.format(
            post=Post,
            JobDescription=JobDescription.strip(),
            resume_data=resume_data.strip(),
            questions_list="\n".join([f"{q['id']}. {q['question']}" for q in questions_list]),
            messages="\n".join([f"{m['role']}: {m['content']}" for m in recent_messages])
        )
        response = llm.invoke(formatted_prompt)
        response_text = response.content.strip() + extra_note
        response_id = next_question_obj.get("id") if next_question_obj and "id" in next_question_obj else next_question_idx

    return {
        "AIResponse": response_text,
        "endInterview": end_interview,
        "question_id": response_id,
        "lastQuestion": last_question
    }
