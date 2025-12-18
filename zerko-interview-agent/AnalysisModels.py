from pydantic import BaseModel, Field
from typing import List

# --- Sub-Models ---

class SkillGap(BaseModel):
    score: int = Field(description="Score out of 20")
    matched: List[str] = Field(description="Skills found in both JD and Resume")
    missing: List[str] = Field(description="Critical skills in JD but NOT in Resume")
    suggestion: str

class ImpactAnalysis(BaseModel):
    quantification_score: int = Field(description="Score out of 15 based on % of numbers used")
    action_verbs_score: int = Field(description="Score out of 10 based on strong verb usage")
    suggestion: str

class ATSCheck(BaseModel):
    score: int = Field(description="Score out of 20")
    detected_sections: List[str]
    formatting_issues: List[str] = Field(description="List of parsing errors or bad formatting")

class Essentials(BaseModel):
    score: int = Field(description="Score out of 10")
    contact_info_present: bool
    links_present: bool

class JobAlignment(BaseModel):
    score: int = Field(description="Score out of 25")
    match_status: str = Field(description="'High', 'Medium', or 'Low'")
    suggestion: str

# --- Main Output Model ---

class AnalysisResult(BaseModel):
    total_score: int = Field(description="Final score out of 100")
    summary: str = Field(description="Executive summary of the candidate")
    relevance: SkillGap
    impact: ImpactAnalysis
    ats_compatibility: ATSCheck
    essentials: Essentials
    jd_alignment: JobAlignment

# --- API Request Schema ---
class AnalyzeRequest(BaseModel):
    resumeId: str
    fileUrl: str
    jobDescription: str