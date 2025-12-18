import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from AnalysisModels import AnalysisResult  # Importing your Pydantic schema
from dotenv import load_dotenv
load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",  
    temperature=0,
    max_retries=2,
)

# --- THE STRUCTURED CHAIN ---
structured_llm = llm.with_structured_output(AnalysisResult)

analysis_prompt = ChatPromptTemplate.from_messages([
    ("system", """
    You are an expert Technical Recruiter and ATS Auditor.
    Analyze the RESUME against the JOB DESCRIPTION (JD) strictly.
    
    ### SCORING RULES (Total 100):
    1. **RELEVANCE (20 pts):** Hard skill matching. Deduct for missing critical tech stacks.
    2. **IMPACT (25 pts):** Check for metrics (%, $) and 'Power Verbs'.
    3. **ATS COMPATIBILITY (20 pts):** Check section headers and formatting health.
    4. **ESSENTIALS (10 pts):** Contact info, LinkedIn/Github links.
    5. **JD ALIGNMENT (25 pts):** Experience level and job title match.
    
    ### CRITICAL INSTRUCTION:
    You must output PURE JSON matching the requested schema exactly.
    Do not add markdown formatting or explanations outside the JSON.
    """),
    ("human", """
    ### DATA FOR ANALYSIS:
    
    **KNOWN FORMATTING ISSUES:**
    {formatting_issues}
    
    **JOB DESCRIPTION (JD):**
    {jd_text}
    
    **RESUME TEXT:**
    {resume_text}
    """)
])

# Create the Chain (Prompt -> LLM -> JSON Parser)
analysis_chain = analysis_prompt | structured_llm

# --- THE MAIN FUNCTION ---

def analyze_resume(resume_text: str, jd_text: str, formatting_issues: list[str]) -> dict:
    """
    Uses LangChain to analyze the resume and returns a dictionary
    that matches the AnalysisResult Pydantic schema.
    """
    try:
        result: AnalysisResult = analysis_chain.invoke({
            "resume_text": resume_text[:30000], 
            "jd_text": jd_text[:10000],
            "formatting_issues": ", ".join(formatting_issues) if formatting_issues else "None detected"
        })
        
        return result.model_dump()

    except Exception as e:
        print(f"❌ LangChain Analysis Failed: {e}")
        raise RuntimeError(f"AI Analysis Failed: {str(e)}")