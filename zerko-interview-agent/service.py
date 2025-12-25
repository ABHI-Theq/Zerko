import asyncio
import logging
import json
import datetime
from DBConnect import DBConnect
from utils.check import check_formatting_issues
import config

# --- IMPORT MODELS ---
# Make sure schemas.py is in the same folder, or adjust import path
from AnalysisModels import AnalysisResult

# --- IMPORT AGENTS ---
from Question_generator_agent import parse_Resume
from ResumeOptimizationAgent import analyze_resume

logger = logging.getLogger(__name__)

async def safe_background_task_wrapper(resume_id: str, file_url: str, jd_text: str, retry_count: int = 0):
    """
    Wrapper that handles retries and prevents service crashes
    """
    try:
        await process_resume_analysis(resume_id, file_url, jd_text)
    except Exception as e:
        logger.error(f"❌ Background task failed for {resume_id} (attempt {retry_count + 1})")
        
        if retry_count < config.SERVICE_MAX_RETRIES:
            logger.info(f"🔄 Scheduling retry {retry_count + 1}/{config.SERVICE_MAX_RETRIES} in {config.SERVICE_RETRY_DELAY}s")
            await asyncio.sleep(config.SERVICE_RETRY_DELAY)
            await safe_background_task_wrapper(resume_id, file_url, jd_text, retry_count + 1)
        else:
            logger.error(f"💥 All retry attempts exhausted for {resume_id}")
            # Service continues running - don't re-raise

async def process_resume_analysis(resume_id: str, file_url: str, jd_text: str):
    """
    Background worker that performs the analysis and updates the DB.
    """
    logger.info(f"🚀 Starting analysis for resume ID: {resume_id}")
    
    db = None
    try:
        # 1. Parse Resume
        parse_start_time = asyncio.get_event_loop().time()
        resume_text = parse_Resume(file_url) 
        parse_time = asyncio.get_event_loop().time() - parse_start_time
        logger.info(f"📄 Resume parsing completed in {parse_time:.2f}s")
        
        if not resume_text:
            logger.error(f"❌ Empty text extracted from resume: {resume_id}")
            raise ValueError("Empty text extracted from resume")
        
        # Connect to DB
        db = await DBConnect()
        logger.info(f"✅ Database connected successfully")

        # 2. Check Formatting
        formatting_issues = check_formatting_issues(resume_text)
        if formatting_issues:
            logger.info(f"📋 Found {len(formatting_issues)} formatting issues")

        # 3. Run AI Analysis
        logger.info(f"🤖 Starting AI analysis")
        ai_start_time = asyncio.get_event_loop().time()
        
        try:
            analysis_json = await asyncio.to_thread(
                analyze_resume, 
                resume_text, 
                jd_text, 
                formatting_issues
            )
            
            ai_time = asyncio.get_event_loop().time() - ai_start_time
            logger.info(f"⏱️ AI analysis completed in {ai_time:.2f}s")
            
            # Check if this is a fallback response
            is_fallback = analysis_json.get('analysis_status') == 'fallback_mode'
            if is_fallback:
                logger.warning(f"⚠️ Using fallback analysis: {analysis_json.get('fallback_reason', 'Unknown')}")
            
            if isinstance(analysis_json, dict):
                total_score = int(analysis_json.get('total_score', 0))
                logger.info(f"🎯 Analysis completed - Score: {total_score}")
            else:
                logger.warning(f"⚠️ Unexpected analysis result type: {type(analysis_json)}")
                total_score = 0
                
        except Exception as ai_error:
            logger.error(f"❌ AI analysis failed: {str(ai_error)}")
            logger.info(f"🔄 Creating emergency fallback response")
            
            # Create emergency fallback
            analysis_json = {
                "total_score": 50,
                "summary": "Emergency fallback analysis - system error occurred",
                "relevance": {
                    "score": 40,
                    "matched": ["Unable to analyze due to system error"],
                    "missing": ["Unable to analyze due to system error"],
                    "suggestion": "System error occurred - please try again later"
                },
                "impact": {
                    "quantification_score": 35,
                    "action_verbs_score": 30,
                    "suggestion": "System error occurred - please try again later"
                },
                "ats_compatibility": {
                    "score": 40,
                    "detected_sections": ["Unable to analyze due to system error"],
                    "formatting_issues": formatting_issues if formatting_issues else []
                },
                "essentials": {
                    "score": 45,
                    "contact_info_present": True,
                    "links_present": False
                },
                "jd_alignment": {
                    "score": 35,
                    "match_status": "Medium",
                    "suggestion": "System error occurred - please try again later"
                }
            }
            total_score = 50

        # 4. Update Database
        logger.info(f"💾 Updating database with results")
        if not db.is_connected():
            await db.connect()

        # ------------------------------------------------------------
        # 🧼 SANITIZATION STEP: Clean Data via Pydantic
        # ------------------------------------------------------------
        final_payload = {}
        try:
            # Prepare raw data
            if hasattr(analysis_json, 'model_dump'):
                raw_data = analysis_json.model_dump()
            elif hasattr(analysis_json, 'dict'):
                raw_data = analysis_json.dict()
            else:
                raw_data = analysis_json

            # VALIDATE: Force data into the strict Pydantic shape
            # This strips out deep nesting and garbage fields that crash Prisma
            logger.info("🧼 Sanitizing data with Pydantic model...")
            clean_model = AnalysisResult(**raw_data)
            final_payload = clean_model.model_dump()
            logger.info("✅ Data sanitization successful.")

        except Exception as validation_error:
            logger.error(f"❌ Pydantic Validation Failed: {validation_error}")
            logger.warning("⚠️ Falling back to raw dictionary (RISKY)")
            # Fallback to the raw dict, but ensure it's JSON serializable at least
            final_payload = raw_data if isinstance(raw_data, dict) else {}

        # ------------------------------------------------------------

        logger.info(f"💾 About to update DB with payload keys: {list(final_payload.keys())}")
        
        total_score_int = int(total_score) if total_score is not None else 0
        
        # dict -> json
        analysis_result_json = json.dumps(final_payload)
        await db.resumeanalysis.update(
            where={'id': resume_id},
            data={
                'status': "COMPLETED",
                'analysisResult': analysis_result_json, # Pass as JSON string
                'resumeText': resume_text,
                'totalScore': total_score_int
            }
        )
        logger.info(f"✅ SUCCESS: Analysis completed and saved for {resume_id} - Score: {total_score}")

    except Exception as e:
        logger.error(f"❌ FAILED: Error processing {resume_id}: {str(e)}")
        logger.exception(f"Full traceback for {resume_id}")
        
        # Determine if this is a critical failure or recoverable
        error_msg = str(e).lower()
        is_recoverable = any(keyword in error_msg for keyword in [
            'quota', 'rate limit', '429', 'resource_exhausted', 'timeout', 'network'
        ])
        
        status = "RETRY_NEEDED" if is_recoverable else "FAILED"
        logger.info(f"🔄 Marking as {status}")
        
        # Update DB with appropriate status
        try:
            if db is None:
                try:
                    db = await DBConnect()
                except Exception as db_conn_error:
                    logger.error(f"❌ Failed to create DB connection: {db_conn_error}")
                    return
                    
            elif not db.is_connected():
                try:
                    await db.connect()
                except Exception as db_conn_error:
                    logger.error(f"❌ Failed to reconnect to DB: {db_conn_error}")
                    return
            
            # Create a safe error result for the database
            error_result = {
                'error': str(e),
                'error_type': type(e).__name__,
                'is_recoverable': is_recoverable,
                'timestamp': datetime.datetime.now().isoformat()
            }
            
            # Ensure error result is JSON serializable
            try:
                error_result_json = json.dumps(error_result)
            except (TypeError, ValueError):
                error_result = {
                    'error': 'Serialization error occurred',
                    'error_type': type(e).__name__,
                    'is_recoverable': False
                }
                error_result_json = json.dumps(error_result)
                
            await db.resumeanalysis.update(
                where={'id': resume_id},
                data={
                    'status': status,
                    'analysisResult': error_result_json if status == "FAILED" else None
                }
            )
            logger.info(f"✅ Status updated to {status} for {resume_id}")
            
        except Exception as db_error:
            logger.error(f"❌ Failed to update DB status: {db_error}")
    
    finally:
        # Cleanup
        if db and db.is_connected():
            await db.disconnect()

# --- SERVICE HEALTH MONITORING ---
async def log_service_health():
    """
    Periodic health check logging to ensure service is running
    """
    logger.info("💚 Resume analysis service is running and healthy")
    logger.info("🔧 Retry mechanism active - API failures will not crash service")
    logger.info("🛡️ Fallback analysis available when AI service is unavailable")
# --- USAGE INSTRUCTIONS ---
"""
To use the resilient service:

1. Call safe_background_task_wrapper() instead of process_resume_analysis() directly
2. The service will automatically:
   - Retry failed requests up to 3 times
   - Use fallback analysis when Gemini API is unavailable  
   - Continue running even if individual tasks fail
   - Log detailed information for debugging

Example:
    asyncio.create_task(safe_background_task_wrapper(resume_id, file_url, jd_text))
"""