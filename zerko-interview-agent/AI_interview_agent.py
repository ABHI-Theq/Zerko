from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
load_dotenv()


def interview_agent_auto_number(Post: str, JobDescription: str, resume_data: str, questions_list: list, messages: list):
    """
    Simplified AI Interview Agent
    Returns only a single text response as 'AIResponse'
    """

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.6)

    # ---- Check if interview just started ----
    if not messages:
        first_question = questions_list[0]["question"]
        return {
            "AIResponse": f"Welcome to the interview for the post {Post}! Let's get started.\n\n{first_question}"
        }

    # ---- Ongoing interview ----
    recent_messages = messages[-5:] if len(messages) > 5 else messages

    prompt_template = PromptTemplate(
        template="""
You are a professional hiring manager conducting a candidate-facing interview.
Use polite, encouraging, and professional tone.

You are provided with:
1. Job Description
2. Candidate Resume
3. A pre-generated ordered list of interview questions
4. Full chat history so far (including which questions were asked)
5. Candidate's last answer

Your task:
- Respond naturally as the next thing to say to the candidate.
- You do NOT need to output analysis, question numbers, or JSON.
- Only produce the text response that should be shown to the candidate.

##Post:
{post}

### Job Description:
{JobDescription}

### Candidate Resume:
{resume_data}

### Predefined Question List (Ordered):
{questions_list}

### Chat History:
{messages}

Respond below:
""",
        input_variables=["post", "JobDescription", "resume_data", "questions_list", "messages"]
    )

    formatted_prompt = prompt_template.format(
        post=Post,
        JobDescription=JobDescription.strip(),
        resume_data=resume_data.strip()[:2000],
        questions_list="\n".join([f"{q['id']}. {q['question']}" for q in questions_list]),
        messages="\n".join([f"{m['role']}: {m['content']}" for m in recent_messages])
    )

    response = llm.invoke(formatted_prompt)

    # Just return the text response
    return {"AIResponse": response.content}


# ---------------- Example Usage ----------------
if __name__ == "__main__":
    questions_list = [
        {"id": 1, "question": "Can you explain how you would design a scalable API for a large web app?"},
        {"id": 2, "question": "What challenges did you face in your last full-stack project?"},
        {"id": 3, "question": "How do you ensure performance optimization in your backend code?"}
    ]

    messages_ongoing = [
        {"role": "interviewer", "content": questions_list[0]["question"]},
        {"role": "candidate", "content": "I implemented caching and load balancing to scale APIs efficiently."}
    ]

    JobDescription = "Looking for a Full Stack Developer skilled in React, Node.js, and scalable backend design."
    resume_data = "Experienced software engineer with strong proficiency in JavaScript, React, and backend APIs using Node.js."

    result = interview_agent_auto_number("Full Stack Developer", JobDescription, resume_data, questions_list, messages_ongoing)

    print("\n🧩 AI Response:\n")
    print(result["AIResponse"])
