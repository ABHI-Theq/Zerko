from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import logging
load_dotenv()

# Configure logging for Interview Agent (Requirement 9.4)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def interview_agent_auto_number(
    Post: str,
    JobDescription: str,
    resume_data: str,
    questions_list: list,
    messages: list,
    time_left: int = None,
    force_next: bool = False,
    lastQuestionAnswered: bool = False
):
    # Log Interview Agent request with context (Requirement 9.4)
    logger.info("Interview Agent request received: post='%s', messages_count=%d, time_left=%s, force_next=%s, lastQuestionAnswered=%s",
                Post, len(messages), time_left, force_next, lastQuestionAnswered)
    
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
        response = {
            "AIResponse": f"Welcome to the interview for {Post}! Let's begin!\n\n{questions_list[0]['question']}",
            "endInterview": False,
            "question_id": questions_list[0].get("id") if "id" in questions_list[0] else 0,
            "lastQuestion": False
        }
        logger.info("Interview Agent response (initial): question_id=%s, endInterview=%s, lastQuestion=%s", 
                    response["question_id"], response["endInterview"], response["lastQuestion"])
        return response

    # ----------- Handle No Answer Detected ------------
    if messages and messages[-1]["role"] == "candidate":
        last_input = messages[-1]["content"].lower().strip()
        # robust set of no-answer markers
        no_answer_markers = [
            "no answer detected.",
            "no answer detected",
            "sorry, could not hear any response.",
            "sorry, could not hear any response",
            "no answer",
            "did not answer"
        ]
        if last_input in no_answer_markers:
            logger.info("No answer detected, moving to next question")
            
            # Determine the next question index by locating the last interviewer question_id
            last_interviewer_qid = None
            for m in reversed(messages):
                if m.get("role") == "interviewer" and "question_id" in m and m.get("question_id") is not None:
                    last_interviewer_qid = m.get("question_id")
                    break

            next_question_idx = 0
            if last_interviewer_qid is not None:
                # try to map the interviewer question_id to questions_list index
                found_idx = None
                for idx, q in enumerate(questions_list):
                    if "id" in q and q["id"] == last_interviewer_qid:
                        found_idx = idx
                        break
                if found_idx is not None:
                    next_question_idx = found_idx + 1
                else:
                    # if question_id looks like an index, use that + 1
                    try:
                        qidx = int(last_interviewer_qid)
                        next_question_idx = qidx + 1
                    except Exception:
                        # fallback: count how many interviewer questions have been asked
                        next_question_idx = len([
                            1 for m in messages
                            if m.get("role") == "interviewer" and "question_id" in m
                        ])
            else:
                # no prior interviewer question recorded, ask first question (index 0)
                next_question_idx = 0

            next_question_obj = questions_list[next_question_idx] if next_question_idx < len(questions_list) else None
            next_question = next_question_obj["question"] if next_question_obj else None

            # If there is a next question, ask it politely
            if next_question:
                response_text = (
                    "I did not catch your answer, so let's move ahead.\n\n" +
                    next_question
                )
                # Final question warning if about to end
                if time_left is not None and time_left <= LAST_QUESTION_THRESHOLD and time_left > END_INTERVIEW_THRESHOLD:
                    response_text += "\n\nWe are approaching the end, this will be your final question."
                response_id = next_question_obj.get("id") if next_question_obj and "id" in next_question_obj else next_question_idx
                response = {
                    "AIResponse": response_text,
                    "endInterview": False,
                    "question_id": response_id,
                    "lastQuestion": (time_left is not None and time_left <= LAST_QUESTION_THRESHOLD and time_left > END_INTERVIEW_THRESHOLD)
                }
                logger.info("Interview Agent response (no answer, next question): question_id=%s, endInterview=%s, lastQuestion=%s", 
                            response["question_id"], response["endInterview"], response["lastQuestion"])
                return response
            # No more questions -> return final feedback and end interview
            else:
                feedback_note = "Thank you for participating in this interview. Based on your responses, you have demonstrated valuable insights and professional knowledge."
                response_text = f"{feedback_note}\n\nThis concludes our interview. Thank you for your time!"
                response = {
                    "AIResponse": response_text,
                    "endInterview": True,
                    "question_id": None,
                    "lastQuestion": False
                }
                logger.info("Interview Agent response (no answer, no more questions): endInterview=%s", response["endInterview"])
                return response

    # ----------- Feedback/End Logic ------------
    end_interview = False
    extra_note = ""
    last_question = False

    if lastQuestionAnswered and messages and messages[-1]["role"] == "candidate":
        # If last question was asked and candidate just answered, only return feedback
        feedback_note = "Thank you for participating in this interview. Based on your responses, you have demonstrated valuable insights and professional knowledge."
        response_text = f"{feedback_note}\n\nThis concludes our interview. Thank you for your time!"
        response = {
            "AIResponse": response_text,
            "endInterview": True,
            "question_id": None,
            "lastQuestion": False
        }
        logger.info("Interview Agent response (last question answered): endInterview=%s", response["endInterview"])
        return response

    if time_left is not None:
        if time_left <= END_INTERVIEW_THRESHOLD:
            feedback_note = "Thank you for participating in this interview. Based on your responses, you have demonstrated valuable insights and professional knowledge."
            response_text = f"{feedback_note}\n\nThis concludes our interview as we've reached the time limit. Thank you for your time!"
            response = {
                "AIResponse": response_text,
                "endInterview": True,
                "question_id": None,
                "lastQuestion": False
            }
            logger.info("Interview Agent response (time limit reached): endInterview=%s, time_left=%s", 
                        response["endInterview"], time_left)
            return response
        elif time_left <= LAST_QUESTION_THRESHOLD:
            last_question = True
            extra_note = "\n\nWe are approaching the end, this will be your final question."
            logger.info("Marking as last question due to time constraint: time_left=%s", time_left)

    if force_next and next_question:
        response_text = next_question + extra_note
        response_id = next_question_obj.get("id") if next_question_obj and "id" in next_question_obj else next_question_idx
        logger.info("Using forced next question: question_id=%s", response_id)
    else:
        recent_messages = messages[-5:] if len(messages) > 5 else messages
        prompt_template = PromptTemplate(
            template="""
You are a professional interviewer.
Be polite, concise, and engaging.
You can ask the next question from the predefined list or a follow-up based on candidate's previous answer.
Do not include analysis or commentary, only what should be spoken to the candidate.

IMPORTANT: If this is NOT the very first interviewer message (there are prior messages in the chat history), do NOT include any greeting or welcome lines (e.g. "Welcome", "Hello", "Hi", "Let's begin") — only produce the next question or feedback/closing text.

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
        
        logger.info("Invoking LLM for next question generation")
        response = llm.invoke(formatted_prompt)
        raw_text = response.content.strip()
        logger.info("LLM response received, processing output")
        
        # If this isn't the very first interviewer message, remove common greeting lines if model included them
        if asked_question_ids:
            lines = [ln for ln in raw_text.splitlines() if ln.strip() != ""]
            filtered_lines = []
            for ln in lines:
                low = ln.strip().lower()
                # drop lines that are pure greetings or startup phrases
                if any(g in low for g in ["welcome to the interview", "welcome", "hello", "hi", "let's begin", "lets begin", "good morning", "good afternoon", "good evening"]):
                    continue
                filtered_lines.append(ln)
            response_text = "\n".join(filtered_lines).strip()
            # fallback to raw_text if filtering removed everything
            if response_text == "":
                response_text = raw_text
        else:
            response_text = raw_text
        response_text = response_text + extra_note
        response_id = next_question_obj.get("id") if next_question_obj and "id" in next_question_obj else next_question_idx

    final_response = {
        "AIResponse": response_text,
        "endInterview": end_interview,
        "question_id": response_id,
        "lastQuestion": last_question
    }
    
    logger.info("Interview Agent response (standard): question_id=%s, endInterview=%s, lastQuestion=%s", 
                final_response["question_id"], final_response["endInterview"], final_response["lastQuestion"])
    
    return final_response
