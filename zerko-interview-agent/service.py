import asyncio
import logging
from DBConnect import DBConnect
from utils.check import check_formatting_issues

# --- IMPORT AGENTS ---
from Question_generator_agent import parse_Resume
from ResumeOptimizationAgent import analyze_resume

logger = logging.getLogger(__name__)

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
        logger.info(f"🤖 [BACKGROUND_TASK] Step 3: Starting AI analysis")
        ai_start_time = asyncio.get_event_loop().time()
        
        analysis_json = await asyncio.to_thread(
            analyze_resume, 
            resume_text, 
            jd_text, 
            formatting_issues
        )
        
        ai_time = asyncio.get_event_loop().time() - ai_start_time
        logger.info(f"⏱️ [BACKGROUND_TASK] AI analysis completed in {ai_time:.2f}s")
        logger.info(f"📊 [BACKGROUND_TASK] Analysis result type: {type(analysis_json)}")
        
        if isinstance(analysis_json, dict):
            logger.info(f"📈 [BACKGROUND_TASK] Analysis keys: {list(analysis_json.keys())}")
            total_score = analysis_json.get('total_score', 0)
            logger.info(f"🎯 [BACKGROUND_TASK] Total score extracted: {total_score}")
        else:
            logger.warning(f"⚠️ [BACKGROUND_TASK] Unexpected analysis result type: {type(analysis_json)}")
            total_score = 0

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
        
        # Update DB with FAILED status
        try:
            logger.info(f"🔄 [BACKGROUND_TASK] Attempting to update status to FAILED for {resume_id}")
            if db is None:
                logger.info(f"🔌 [BACKGROUND_TASK] Creating new DB connection for failure update")
                db = await DBConnect()
            elif not db.is_connected():
                logger.info(f"🔌 [BACKGROUND_TASK] Reconnecting to database for failure update")
                await db.connect()
                
            await db.resumeanalysis.update(
                where={'id': resume_id},
                data={'status': "FAILED"}
            )
            logger.info(f"✅ [BACKGROUND_TASK] Status updated to FAILED for {resume_id}")
        except Exception as db_error:
            logger.error(f"❌ [BACKGROUND_TASK] Failed to update DB status to FAILED for {resume_id}: {db_error}")
            logger.exception(f"❌ [BACKGROUND_TASK] DB update failure traceback")
    
    finally:
        # Cleanup
        if db and db.is_connected():
            logger.info(f"🔌 [BACKGROUND_TASK] Disconnecting from database")
            await db.disconnect()
        logger.info(f"🏁 [BACKGROUND_TASK] Background task completed for {resume_id}")