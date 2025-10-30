from typing import List
import os
import sys
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure the agent package path is importable
# Adjust path relative to this file to point to the zerko-interview-agent folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "zerko-interview-agent")))

# Import the agent's Pydantic models and function
from FeedBackReportAgent import FeedBackReportModel, feedbackReport_agent  # type: ignore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("feedback-backend")

app = FastAPI(title="Zerko Feedback API")

# CORS - allow origins via env or default to local frontend & localhost
_allowed = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/feedback-report")
async def create_feedback_report(payload: FeedBackReportModel):
    """
    Accepts the interview payload (validated by FeedBackReportModel),
    calls the feedbackReport_agent and returns the structured result.
    """
    logger.info("Received feedback report request for post=%s type=%s", payload.post, payload.interview_type)

    try:
        result = feedbackReport_agent(**payload.dict())
    except Exception as e:
        logger.exception("Unhandled error while generating feedback report")
        raise HTTPException(status_code=500, detail="Internal server error")

    if not result.get("success"):
        # Propagate meaningful error messages where available
        detail = result.get("error") or result.get("meta") or "Failed to generate feedback"
        raise HTTPException(status_code=500, detail=detail)

    return result


if __name__ == "__main__":
    # Run with: python main.py
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
