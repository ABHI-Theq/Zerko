import os
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import ChatGoogleGenerativeAIError
from langchain_core.prompts import ChatPromptTemplate
from AnalysisModels import AnalysisResult  # Importing your Pydantic schema
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.genai.errors import ClientError
import config

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

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

# --- RETRY CONFIGURATION ---
def should_retry_exception(exception):
    """Determine if we should retry based on the exception type and message"""
    if isinstance(exception, (ChatGoogleGenerativeAIError, ClientError)):
        error_msg = str(exception).lower()
        # Retry on quota/rate limit errors
        if any(keyword in error_msg for keyword in ['quota', 'rate limit', '429', 'resource_exhausted']):
            return True
    return False

@retry(
    stop=stop_after_attempt(config.GEMINI_MAX_RETRIES),
    wait=wait_exponential(
        multiplier=config.GEMINI_RETRY_MULTIPLIER, 
        min=config.GEMINI_RETRY_MIN_WAIT, 
        max=config.GEMINI_RETRY_MAX_WAIT
    ),
    retry=retry_if_exception_type((ChatGoogleGenerativeAIError, ClientError)),
    reraise=False  # Don't reraise after all attempts fail
)
def _call_gemini_with_retry(resume_text: str, jd_text: str, formatting_issues: str) -> AnalysisResult:
    """
    Internal function that calls Gemini with retry logic
    """
    logger.info("🤖 Attempting Gemini API call...")
    try:
        result: AnalysisResult = analysis_chain.invoke({
            "resume_text": resume_text[:30000], 
            "jd_text": jd_text[:10000],
            "formatting_issues": formatting_issues
        })
        logger.info("✅ Gemini API call successful")
        return result
    except Exception as e:
        logger.warning(f"⚠️ Gemini API call failed: {str(e)}")
        raise

def _create_fallback_analysis(resume_text: str, jd_text: str, formatting_issues: list[str]) -> dict:
    """
    Create a fallback analysis when Gemini API is unavailable
    """
    logger.info("🔄 Creating fallback analysis due to API unavailability")
    
    # Basic analysis based on text content
    resume_length = len(resume_text)
    jd_length = len(jd_text)
    
    # Simple scoring based on content length and formatting
    base_score = config.FALLBACK_BASE_SCORE
    
    # Adjust based on resume length (optimal range from config)
    if config.FALLBACK_OPTIMAL_RESUME_LENGTH_MIN <= resume_length <= config.FALLBACK_OPTIMAL_RESUME_LENGTH_MAX:
        base_score += 10
    elif resume_length < 500:
        base_score -= 15
    elif resume_length > 5000:
        base_score -= 5
    
    # Adjust based on formatting issues
    formatting_penalty = min(
        len(formatting_issues) * config.FALLBACK_FORMATTING_PENALTY_PER_ISSUE, 
        config.FALLBACK_MAX_FORMATTING_PENALTY
    )
    base_score -= formatting_penalty
    
    # Ensure score is within valid range
    total_score = max(0, min(100, base_score))
    
    fallback_analysis = {
        "total_score": total_score,
        "relevance_score": max(0, total_score - 20),
        "impact_score": max(0, total_score - 15),
        "ats_score": max(0, total_score - 10),
        "essentials_score": max(0, total_score - 5),
        "jd_alignment_score": max(0, total_score - 10),
        "strengths": [
            "Resume content detected and processed",
            "Basic structure appears intact",
            "Content length is appropriate" if 1000 <= resume_length <= 3000 else "Consider adjusting content length"
        ],
        "improvements": [
            "AI analysis temporarily unavailable - this is a basic assessment",
            "Try again later for detailed AI-powered insights",
            "Consider reviewing formatting if issues were detected"
        ] + ([f"Address {len(formatting_issues)} formatting issues"] if formatting_issues else []),
        "missing_keywords": ["Unable to analyze keywords - AI service unavailable"],
        "ats_issues": formatting_issues if formatting_issues else ["No major formatting issues detected"],
        "analysis_status": "fallback_mode",
        "fallback_reason": "AI service temporarily unavailable due to quota limits"
    }
    
    return fallback_analysis

# --- THE MAIN FUNCTION ---

def analyze_resume(resume_text: str, jd_text: str, formatting_issues: list[str]) -> dict:
    """
    Uses LangChain to analyze the resume with retry logic and fallback.
    Returns a dictionary that matches the AnalysisResult Pydantic schema.
    Never raises exceptions - always returns a valid response.
    """
    formatting_issues_str = ", ".join(formatting_issues) if formatting_issues else "None detected"
    
    try:
        logger.info("🚀 Starting resume analysis with retry mechanism")
        
        # Try Gemini API with retry logic
        result = _call_gemini_with_retry(resume_text, jd_text, formatting_issues_str)
        
        if result:
            logger.info("✅ Analysis completed successfully via Gemini API")
            return result.model_dump()
        else:
            logger.warning("⚠️ Gemini API returned empty result, using fallback")
            return _create_fallback_analysis(resume_text, jd_text, formatting_issues)
            
    except Exception as e:
        logger.error(f"❌ All Gemini API retry attempts failed: {str(e)}")
        logger.info("🔄 Switching to fallback analysis mode")
        
        # Return fallback analysis instead of crashing
        return _create_fallback_analysis(resume_text, jd_text, formatting_issues)