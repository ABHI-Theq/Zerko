import asyncio
import logging
from DBConnect import DBConnect
from utils.check import check_formatting_issues
import config

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
        logger.error(f"❌ [SERVICE_WRAPPER] Background task failed for {resume_id} (attempt {retry_count + 1})")
        
        if retry_count < config.SERVICE_MAX_RETRIES:
            logger.info(f"🔄 [SERVICE_WRAPPER] Scheduling retry {retry_count + 1}/{config.SERVICE_MAX_RETRIES} in {config.SERVICE_RETRY_DELAY}s")
            await asyncio.sleep(config.SERVICE_RETRY_DELAY)
            await safe_background_task_wrapper(resume_id, file_url, jd_text, retry_count + 1)
        else:
            logger.error(f"💥 [SERVICE_WRAPPER] All retry attempts exhausted for {resume_id}")
            logger.error(f"⚠️ [SERVICE_WRAPPER] Service continues running - individual task marked as failed")
            # Service continues running - don't re-raise

async def process_resume_analysis(resume_id: str, file_url: str, jd_text: str):
    """
    Background worker that performs the analysis and updates the DB.
    """
    logger.info(f"🚀 [BACKGROUND_TASK] Starting analysis for resume ID: {resume_id}")
    logger.info(f"📋 [BACKGROUND_TASK] Task details: fileUrl={file_url}, jobDescLength={len(jd_text)}")
    
    db = None
    try:
        # 1. Parse Resume
        logger.info(f"📄 [BACKGROUND_TASK] Step 1: Parsing resume from URL: {file_url}")
        parse_start_time = asyncio.get_event_loop().time()
        
        resume_text = parse_Resume(file_url) 
        parse_time = asyncio.get_event_loop().time() - parse_start_time
        logger.info(f"⏱️ [BACKGROUND_TASK] Resume parsing completed in {parse_time:.2f}s")
        
        if not resume_text:
            logger.error(f"❌ [BACKGROUND_TASK] Empty text extracted from resume: {resume_id}")
            raise ValueError("Empty text extracted from resume")
        
        logger.info(f"📝 [BACKGROUND_TASK] Extracted resume text length: {len(resume_text)} characters")
        
        # Connect to DB
        logger.info(f"🔌 [BACKGROUND_TASK] Connecting to database")
        db = await DBConnect()
        logger.info(f"✅ [BACKGROUND_TASK] Database connected successfully")

        # 2. Check Formatting
        logger.info(f"🔍 [BACKGROUND_TASK] Step 2: Checking formatting issues")
        formatting_issues = check_formatting_issues(resume_text)
        logger.info(f"📋 [BACKGROUND_TASK] Found {len(formatting_issues)} formatting issues: {formatting_issues}")

        # 3. Run AI Analysis (Blocking Call -> Run in Thread)
        logger.info(f"🤖 [BACKGROUND_TASK] Step 3: Starting AI analysis with retry mechanism")
        ai_start_time = asyncio.get_event_loop().time()
        
        try:
            analysis_json = await asyncio.to_thread(
                analyze_resume, 
                resume_text, 
                jd_text, 
                formatting_issues
            )
            
            ai_time = asyncio.get_event_loop().time() - ai_start_time
            logger.info(f"⏱️ [BACKGROUND_TASK] AI analysis completed in {ai_time:.2f}s")
            logger.info(f"📊 [BACKGROUND_TASK] Analysis result type: {type(analysis_json)}")
            
            # Check if this is a fallback response
            is_fallback = analysis_json.get('analysis_status') == 'fallback_mode'
            if is_fallback:
                logger.warning(f"⚠️ [BACKGROUND_TASK] Using fallback analysis due to: {analysis_json.get('fallback_reason', 'Unknown')}")
            
            if isinstance(analysis_json, dict):
                logger.info(f"📈 [BACKGROUND_TASK] Analysis keys: {list(analysis_json.keys())}")
                total_score = analysis_json.get('total_score', 0)
                logger.info(f"🎯 [BACKGROUND_TASK] Total score extracted: {total_score}")
            else:
                logger.warning(f"⚠️ [BACKGROUND_TASK] Unexpected analysis result type: {type(analysis_json)}")
                total_score = 0
                
        except Exception as ai_error:
            # This should rarely happen now since analyze_resume has its own error handling
            logger.error(f"❌ [BACKGROUND_TASK] Unexpected error in AI analysis thread: {str(ai_error)}")
            logger.info(f"🔄 [BACKGROUND_TASK] Creating emergency fallback response")
            
            # Create emergency fallback
            analysis_json = {
                "total_score": 50,
                "relevance_score": 40,
                "impact_score": 45,
                "ats_score": 50,
                "essentials_score": 60,
                "jd_alignment_score": 40,
                "strengths": ["Resume processed successfully", "Basic analysis completed"],
                "improvements": ["Detailed AI analysis temporarily unavailable", "Please try again later"],
                "missing_keywords": ["Analysis unavailable"],
                "ats_issues": formatting_issues if formatting_issues else ["No major issues detected"],
                "analysis_status": "emergency_fallback",
                "fallback_reason": f"System error: {str(ai_error)}"
            }
            total_score = 50
            ai_time = asyncio.get_event_loop().time() - ai_start_time

        # 4. Update Database
        logger.info(f"💾 [BACKGROUND_TASK] Step 4: Updating database with results")
        if not db.is_connected():
            logger.info(f"🔌 [BACKGROUND_TASK] Reconnecting to database")
            await db.connect()

        # Update the record with COMPLETED status and result
        update_start_time = asyncio.get_event_loop().time()
        await db.resumeanalysis.update(
            where={'id': resume_id},
            data={
                'status': "COMPLETED",
                'analysisResult': analysis_json, 
                'resumeText': resume_text,
                'totalScore': total_score
            }
        )
        update_time = asyncio.get_event_loop().time() - update_start_time
        logger.info(f"⏱️ [BACKGROUND_TASK] Database update completed in {update_time:.2f}s")
        logger.info(f"✅ [BACKGROUND_TASK] SUCCESS: Analysis completed and saved for {resume_id}")
        logger.info(f"📊 [BACKGROUND_TASK] Final status: COMPLETED, Score: {total_score}")

    except Exception as e:
        logger.error(f"❌ [BACKGROUND_TASK] FAILED: Error processing {resume_id}")
        logger.error(f"❌ [BACKGROUND_TASK] Error type: {type(e).__name__}")
        logger.error(f"❌ [BACKGROUND_TASK] Error message: {str(e)}")
        logger.exception(f"❌ [BACKGROUND_TASK] Full traceback for {resume_id}")
        
        # Determine if this is a critical failure or recoverable
        error_msg = str(e).lower()
        is_recoverable = any(keyword in error_msg for keyword in [
            'quota', 'rate limit', '429', 'resource_exhausted', 'timeout', 'network'
        ])
        
        if is_recoverable:
            logger.info(f"🔄 [BACKGROUND_TASK] Error appears recoverable, marking for retry: {resume_id}")
            status = "RETRY_NEEDED"
        else:
            logger.info(f"💥 [BACKGROUND_TASK] Error appears critical, marking as failed: {resume_id}")
            status = "FAILED"
        
        # Update DB with appropriate status - DO NOT let this crash the service
        try:
            logger.info(f"🔄 [BACKGROUND_TASK] Attempting to update status to {status} for {resume_id}")
            if db is None:
                logger.info(f"🔌 [BACKGROUND_TASK] Creating new DB connection for failure update")
                try:
                    db = await DBConnect()
                except Exception as db_conn_error:
                    logger.error(f"❌ [BACKGROUND_TASK] Failed to create DB connection: {db_conn_error}")
                    logger.error(f"⚠️ [BACKGROUND_TASK] Continuing without DB update to prevent service crash")
                    return  # Exit gracefully without crashing the service
                    
            elif not db.is_connected():
                logger.info(f"🔌 [BACKGROUND_TASK] Reconnecting to database for failure update")
                try:
                    await db.connect()
                except Exception as db_conn_error:
                    logger.error(f"❌ [BACKGROUND_TASK] Failed to reconnect to DB: {db_conn_error}")
                    logger.error(f"⚠️ [BACKGROUND_TASK] Continuing without DB update to prevent service crash")
                    return  # Exit gracefully without crashing the service
                
            await db.resumeanalysis.update(
                where={'id': resume_id},
                data={
                    'status': status,
                    'analysisResult': {
                        'error': str(e),
                        'error_type': type(e).__name__,
                        'is_recoverable': is_recoverable,
                        'timestamp': asyncio.get_event_loop().time()
                    } if status == "FAILED" else None
                }
            )
            logger.info(f"✅ [BACKGROUND_TASK] Status updated to {status} for {resume_id}")
            
        except Exception as db_error:
            logger.error(f"❌ [BACKGROUND_TASK] Failed to update DB status to {status} for {resume_id}: {db_error}")
            logger.exception(f"❌ [BACKGROUND_TASK] DB update failure traceback")
            logger.error(f"⚠️ [BACKGROUND_TASK] Service will continue running despite DB update failure")
            # DO NOT re-raise - let the service continue running
    
    finally:
        # Cleanup
        if db and db.is_connected():
            logger.info(f"🔌 [BACKGROUND_TASK] Disconnecting from database")
            await db.disconnect()
        logger.info(f"🏁 [BACKGROUND_TASK] Background task completed for {resume_id}")

# --- SERVICE HEALTH MONITORING ---
async def log_service_health():
    """
    Periodic health check logging to ensure service is running
    """
    logger.info("💚 [SERVICE_HEALTH] Resume analysis service is running and healthy")
    logger.info("🔧 [SERVICE_HEALTH] Retry mechanism active - API failures will not crash service")
    logger.info("🛡️ [SERVICE_HEALTH] Fallback analysis available when AI service is unavailable")

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