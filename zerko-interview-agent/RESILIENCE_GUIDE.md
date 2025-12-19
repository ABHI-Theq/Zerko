# Resume Analysis Service - Resilience Guide

## Overview

The resume analysis service has been enhanced with robust error handling and retry mechanisms to ensure the application **never shuts down** due to API failures, quota limits, or temporary service disruptions.

## Key Features

### 1. **Multi-Layer Retry Mechanism**

#### Layer 1: Gemini API Retries
- **5 automatic retry attempts** for Gemini API calls
- **Exponential backoff**: 4s → 8s → 16s → 32s → 64s
- Specifically handles quota exhaustion (429 errors)
- Configurable via `config.py`

#### Layer 2: Service-Level Retries
- **3 additional retry attempts** at the service level
- **60-second delay** between service retries
- Allows time for quota limits to reset
- Prevents cascading failures

### 2. **Intelligent Fallback Analysis**

When all retry attempts fail, the service provides a **fallback analysis** instead of crashing:

```python
{
    "total_score": 50,  # Calculated based on content
    "relevance_score": 40,
    "impact_score": 45,
    "ats_score": 50,
    "essentials_score": 60,
    "jd_alignment_score": 40,
    "strengths": ["Resume processed", "Basic structure intact"],
    "improvements": ["AI analysis temporarily unavailable"],
    "analysis_status": "fallback_mode",
    "fallback_reason": "AI service temporarily unavailable due to quota limits"
}
```

### 3. **Graceful Error Handling**

- All exceptions are caught and logged
- Database updates never crash the service
- Failed tasks are marked appropriately without affecting other tasks
- Service continues running even if individual analyses fail

### 4. **Comprehensive Logging**

Every step is logged with emojis for easy visual scanning:
- 🚀 Starting operations
- ✅ Successful completions
- ⚠️ Warnings and fallbacks
- ❌ Errors (non-fatal)
- 🔄 Retry attempts
- 💚 Health checks

## Configuration

All retry parameters are configurable in `config.py`:

```python
# Gemini API Retry Settings
GEMINI_MAX_RETRIES = 5
GEMINI_RETRY_MIN_WAIT = 4  # seconds
GEMINI_RETRY_MAX_WAIT = 300  # seconds
GEMINI_RETRY_MULTIPLIER = 2

# Service Level Retry Settings
SERVICE_MAX_RETRIES = 3
SERVICE_RETRY_DELAY = 60  # seconds

# Fallback Analysis Settings
FALLBACK_BASE_SCORE = 50
FALLBACK_OPTIMAL_RESUME_LENGTH_MIN = 1000
FALLBACK_OPTIMAL_RESUME_LENGTH_MAX = 3000
```

## Usage

### Starting the Service

```bash
cd zerko-interview-agent
pip install -r requirements.txt
python main.py  # or uvicorn main:app
```

### Using the Resilient Background Task

```python
from service import safe_background_task_wrapper

# Use the wrapper instead of calling process_resume_analysis directly
asyncio.create_task(
    safe_background_task_wrapper(resume_id, file_url, jd_text)
)
```

### Testing Resilience

Run the test script to verify the resilience mechanisms:

```bash
python test_resilience.py
```

## Error Scenarios Handled

### 1. **Quota Exhaustion (429 Error)**
- **Behavior**: Retries with exponential backoff
- **Fallback**: Returns basic analysis after all retries
- **Service**: Continues running

### 2. **Network Timeouts**
- **Behavior**: Retries immediately
- **Fallback**: Returns basic analysis
- **Service**: Continues running

### 3. **Database Connection Failures**
- **Behavior**: Attempts to reconnect
- **Fallback**: Logs error and continues
- **Service**: Continues running

### 4. **Invalid API Responses**
- **Behavior**: Logs error
- **Fallback**: Returns basic analysis
- **Service**: Continues running

### 5. **Unexpected Exceptions**
- **Behavior**: Catches all exceptions
- **Fallback**: Returns emergency fallback
- **Service**: Continues running

## Monitoring

### Log Patterns to Watch

**Successful Analysis:**
```
✅ [BACKGROUND_TASK] SUCCESS: Analysis completed
🎯 [BACKGROUND_TASK] Total score: 75
```

**Fallback Mode:**
```
⚠️ [BACKGROUND_TASK] Using fallback analysis
🔄 FALLBACK MODE USED
```

**Retry Attempts:**
```
⚠️ Gemini API call failed: 429 Too Many Requests
🔄 [SERVICE_WRAPPER] Scheduling retry 1/3 in 60s
```

**Service Health:**
```
💚 [SERVICE_HEALTH] Resume analysis service is running and healthy
```

## Troubleshooting

### Issue: All analyses using fallback mode

**Cause**: Gemini API quota exhausted

**Solutions**:
1. Wait for quota to reset (check https://ai.dev/usage)
2. Upgrade to paid tier for higher quotas
3. Reduce analysis frequency
4. Use a different model (e.g., gemini-1.5-flash)

### Issue: Service slow to respond

**Cause**: Multiple retry attempts in progress

**Solutions**:
1. Check logs for retry patterns
2. Adjust retry delays in `config.py`
3. Reduce `GEMINI_MAX_RETRIES` if needed

### Issue: Database connection errors

**Cause**: Database unavailable or connection pool exhausted

**Solutions**:
1. Check database status
2. Verify connection string in `.env`
3. Service will continue running and retry

## Benefits

✅ **Zero Downtime**: Service never crashes due to API failures
✅ **User Experience**: Always returns a response (AI or fallback)
✅ **Cost Effective**: Handles free tier quota limits gracefully
✅ **Debuggable**: Comprehensive logging for troubleshooting
✅ **Configurable**: Easy to adjust retry parameters
✅ **Scalable**: Handles multiple concurrent requests safely

## Files Modified

1. `requirements.txt` - Added `tenacity` for retry logic
2. `ResumeOptimizationAgent.py` - Added retry decorator and fallback analysis
3. `service.py` - Enhanced error handling and service-level retries
4. `config.py` - Centralized configuration (NEW)
5. `test_resilience.py` - Test script (NEW)
6. `RESILIENCE_GUIDE.md` - This documentation (NEW)

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Test the resilience: `python test_resilience.py`
3. Monitor logs when running the service
4. Adjust configuration in `config.py` as needed
5. Consider upgrading Gemini API tier if fallback mode is frequent

## Support

If you encounter issues:
1. Check the logs for detailed error messages
2. Verify your Gemini API key and quota
3. Run the test script to isolate the problem
4. Review the configuration in `config.py`