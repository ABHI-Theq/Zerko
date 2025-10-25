from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def interview_agent_auto_number(
    Post: str,
    JobDescription: str,
    resume_data: str,
    questions_list: list,
    messages: list,
    interview_type: str = "technical",
    time_left: int = None,
    force_next: bool = False
):
    """
    AI Interview Agent with proper state management and question tracking.

    Args:
        Post: Job position title
        JobDescription: Full job description
        resume_data: Candidate's resume text
        questions_list: List of question dicts with 'id' and 'question' keys
        messages: Conversation history with 'role', 'content', and optional 'question_id'
        interview_type: Type of interview (technical, behavioral, etc.)
        time_left: Milliseconds remaining in interview
        force_next: Force moving to next question without follow-up

    Returns:
        dict with AIResponse, endInterview, question_id, lastQuestion flags
    """

    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0.7)

    # Time thresholds in milliseconds
    LAST_QUESTION_WARNING_TIME = 2 * 60 * 1000  # 3 minutes remaining
    FORCE_END_TIME = 30 * 1000  # 30 seconds remaining

    # === INITIAL GREETING ===
    if not messages:
        first_question = questions_list[0]
        greeting = (
            f"Hello! Welcome to your {interview_type} interview for the {Post} position. "
            f"I'm excited to learn more about you today. Let's get started!\n\n"
            f"{first_question['question']}"
        )
        return {
            "AIResponse": greeting,
            "endInterview": False,
            "question_id": first_question.get("id", 0),
            "lastQuestion": False
        }

    # === CALCULATE CURRENT STATE ===
    asked_question_ids = [
        msg.get("question_id")
        for msg in messages
        if msg["role"] == "interviewer" and msg.get("question_id") is not None
    ]

    num_questions_asked = len(asked_question_ids)
    total_questions = len(questions_list)
    all_questions_asked = num_questions_asked >= total_questions

    # Get the next question to ask
    next_question_obj = None
    if num_questions_asked < total_questions:
        next_question_obj = questions_list[num_questions_asked]

    # === HANDLE "NO ANSWER DETECTED" ===
    last_candidate_message = None
    if messages and messages[-1]["role"] == "candidate":
        last_candidate_message = messages[-1]["content"].strip().lower()

    is_no_answer = last_candidate_message in [
        "no answer detected.",
        "sorry, could not hear any response.",
        "no answer detected",
        "sorry, could not hear any response"
    ]

    if is_no_answer:
        if next_question_obj:
            polite_skip = (
                "I didn't catch that. No worries, let's move on to the next question.\n\n"
                f"{next_question_obj['question']}"
            )
            return {
                "AIResponse": polite_skip,
                "endInterview": False,
                "question_id": next_question_obj.get("id", num_questions_asked),
                "lastQuestion": False
            }
        else:
            return {
                "AIResponse": (
                    "I didn't catch your last response, but we've covered all the questions. "
                    "Thank you for your time today! We'll be in touch soon."
                ),
                "endInterview": True,
                "question_id": None,
                "lastQuestion": False
            }

    # === TIME-BASED ENDING ===
    should_end_now = False
    is_last_question_warning = False

    if time_left is not None:
        if time_left <= FORCE_END_TIME:
            should_end_now = True
        elif time_left <= LAST_QUESTION_WARNING_TIME and not all_questions_asked:
            is_last_question_warning = True

    # === FORCE END INTERVIEW ===
    if should_end_now:
        closing_message = (
            "We've reached the end of our time together. "
            "Thank you so much for your thoughtful responses today. "
            "It was great speaking with you, and we'll follow up with next steps soon. "
            "Have a wonderful day!"
        )
        return {
            "AIResponse": closing_message,
            "endInterview": True,
            "question_id": None,
            "lastQuestion": False
        }

    # === ALL QUESTIONS COMPLETED ===
    if all_questions_asked and not force_next:
        conclusion = (
            "That covers all of our prepared questions. "
            "Thank you for taking the time to interview with us today! "
            "Your responses were insightful, and we appreciate your interest in the position. "
            "We'll be in touch soon with the next steps. Take care!"
        )
        return {
            "AIResponse": conclusion,
            "endInterview": True,
            "question_id": None,
            "lastQuestion": False
        }

    # === GENERATE AI RESPONSE ===
    recent_messages = messages[-6:] if len(messages) > 6 else messages

    # Build context for AI
    chat_context = "\n".join([
        f"{'Interviewer' if m['role'] == 'interviewer' else 'Candidate'}: {m['content']}"
        for m in recent_messages
    ])

    questions_context = "\n".join([
        f"{i+1}. [ID:{q.get('id', i)}] {q['question']}"
        for i, q in enumerate(questions_list)
    ])

    asked_ids_str = ", ".join([str(qid) for qid in asked_question_ids])

    # Determine what AI should do
    if force_next and next_question_obj:
        instruction = f"Ask the next scheduled question (ID {next_question_obj.get('id')})"
        next_q_hint = next_question_obj['question']
    elif next_question_obj and num_questions_asked < 3:
        instruction = "Provide brief feedback on the candidate's answer, then ask the next scheduled question"
        next_q_hint = next_question_obj['question']
    elif next_question_obj:
        instruction = (
            "You may either ask a relevant follow-up question based on the candidate's response, "
            "OR move to the next scheduled question. Choose based on context."
        )
        next_q_hint = f"Next scheduled: {next_question_obj['question']}"
    else:
        instruction = "Provide brief positive feedback and smoothly wrap up the interview"
        next_q_hint = "No more questions remaining"

    prompt_template = PromptTemplate(
        template="""You are an experienced {interview_type} interviewer conducting an interview for the {Post} position.

**Job Description:**
{JobDescription}

**Candidate's Resume:**
{resume_data}

**All Interview Questions (in order):**
{questions_context}

**Questions Already Asked (IDs):** {asked_ids_str}

**Recent Conversation:**
{chat_context}

**Your Task:** {instruction}

**Next Question Hint:** {next_q_hint}

**Instructions:**
- Be conversational, warm, and professional
- Keep responses concise (2-4 sentences max)
- If asking next question, provide brief transition then ask it clearly
- Do NOT include meta-commentary or analysis
- Speak naturally as if in a real interview
- If this is the final question, mention "This will be our last question"

**Your Response:**""",
        input_variables=[
            "interview_type", "Post", "JobDescription", "resume_data",
            "questions_context", "asked_ids_str", "chat_context",
            "instruction", "next_q_hint"
        ]
    )

    formatted_prompt = prompt_template.format(
        interview_type=interview_type,
        Post=Post,
        JobDescription=JobDescription,
        resume_data=resume_data,
        questions_context=questions_context,
        asked_ids_str=asked_ids_str if asked_ids_str else "None",
        chat_context=chat_context,
        instruction=instruction,
        next_q_hint=next_q_hint
    )

    try:
        response = llm.invoke(formatted_prompt)
        ai_response = response.content.strip()
    except Exception as e:
        logger.error(f"LLM invocation failed: {e}")
        if next_question_obj:
            ai_response = f"Thank you for that answer. Let's continue.\n\n{next_question_obj['question']}"
        else:
            ai_response = "Thank you for your responses. That concludes our interview today."

    # Add last question warning if needed
    if is_last_question_warning and next_question_obj:
        if "last question" not in ai_response.lower():
            ai_response += "\n\nJust so you know, we have time for one more question after this."

    # Determine which question ID to return
    response_question_id = None
    if next_question_obj and (force_next or "?" in ai_response):
        response_question_id = next_question_obj.get("id", num_questions_asked)

    return {
        "AIResponse": ai_response,
        "endInterview": False,
        "question_id": response_question_id,
        "lastQuestion": is_last_question_warning
    }
