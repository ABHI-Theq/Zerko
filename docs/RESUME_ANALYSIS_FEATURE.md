# Resume Analysis & Optimization System - Zerko Platform

## 📋 Overview

The Zerko Resume Analysis & Optimization System is a comprehensive AI-powered solution that evaluates resumes against job descriptions, providing detailed insights, scoring, and actionable recommendations. Built with Google Gemini 2.5 Pro and advanced text processing capabilities, this system helps candidates optimize their resumes for better job matching and ATS compatibility.

## ✨ Core Features & Capabilities

### 🎯 Intelligent Resume Analysis

The resume analysis system provides multi-dimensional evaluation across five key areas:

1. **Skills Relevance (20 points)**: Matches candidate skills against job requirements
2. **Impact & Metrics (25 points)**: Evaluates quantifiable achievements and action verbs
3. **ATS Compatibility (20 points)**: Assesses formatting and structure for ATS systems
4. **Essential Information (10 points)**: Validates contact information and professional links
5. **Job Alignment (25 points)**: Measures experience level and role compatibility

### 🤖 AI-Powered Processing Pipeline

```
Resume Upload → Text Extraction → AI Analysis → Skills Matching → ATS Compatibility → Score Generation → Recommendations
```

#### Advanced Text Extraction
- **PyMuPDF Integration**: High-accuracy text extraction from PDF documents
- **Multi-format Support**: PDF, DOC, DOCX file processing
- **Layout Preservation**: Maintains document structure and formatting context
- **Error Handling**: Robust processing of corrupted or complex documents

#### Intelligent Analysis Engine
```python
def analyze_resume(resume_text: str, jd_text: str, formatting_issues: list[str]) -> dict:
    """
    Comprehensive resume analysis using Google Gemini 2.5 Pro
    """
    
    # Initialize structured LLM with Pydantic output parsing
    structured_llm = llm.with_structured_output(AnalysisResult)
    
    analysis_prompt = ChatPromptTemplate.from_messages([
        ("system", """
        You are an expert Technical Recruiter and ATS Auditor.
        Analyze the RESUME against the JOB DESCRIPTION strictly.
        
        ### SCORING RULES (Total 100):
        1. **RELEVANCE (20 pts):** Hard skill matching. Deduct for missing critical tech stacks.
        2. **IMPACT (25 pts):** Check for metrics (%, $) and 'Power Verbs'.
        3. **ATS COMPATIBILITY (20 pts):** Check section headers and formatting health.
        4. **ESSENTIALS (10 pts):** Contact info, LinkedIn/Github links.
        5. **JD ALIGNMENT (25 pts):** Experience level and job title match.
        
        Output PURE JSON matching the requested schema exactly.
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
    
    # Create analysis chain with structured output
    analysis_chain = analysis_prompt | structured_llm
    
    try:
        result = analysis_chain.invoke({
            "resume_text": resume_text[:30000], 
            "jd_text": jd_text[:10000],
            "formatting_issues": ", ".join(formatting_issues) if formatting_issues else "None detected"
        })
        
        return result.model_dump()
    except Exception as e:
        raise RuntimeError(f"AI Analysis Failed: {str(e)}")
```

## 🏗️ System Architecture

### Backend Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    RESUME ANALYSIS SYSTEM                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Resume Upload       │  ← User uploads PDF/DOC/DOCX
│  - File validation   │
│  - Size checking     │
│  - Format verification│
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  Cloudinary Storage  │  ← Secure cloud storage
│  - CDN optimization  │
│  - URL generation    │
│  - Access control    │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  Text Extraction     │  ← PyMuPDF processing
│  - PDF parsing       │
│  - Layout analysis   │
│  - Content extraction│
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  AI Analysis Engine  │  ← Google Gemini 2.5 Pro
│  - Skills matching   │
│  - Impact assessment │
│  - ATS compatibility │
│  - Job alignment     │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  Score Generation    │  ← Multi-dimensional scoring
│  - Category scores   │
│  - Overall rating    │
│  - Recommendations   │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  Database Storage    │  ← PostgreSQL with Prisma
│  - Analysis results  │
│  - User associations │
│  - Historical data   │
└──────────────────────┘
```

### Data Models & Schema

#### Analysis Result Structure
```python
class AnalysisResult(BaseModel):
    summary: str = Field(..., description="Executive summary of resume analysis")
    total_score: int = Field(..., description="Overall score out of 100")
    
    relevance: RelevanceAnalysis = Field(..., description="Skills relevance analysis")
    impact: ImpactAnalysis = Field(..., description="Impact and metrics analysis")
    ats_compatibility: ATSAnalysis = Field(..., description="ATS compatibility analysis")
    jd_alignment: JobAlignmentAnalysis = Field(..., description="Job description alignment")
    
    recommendations: List[str] = Field(..., description="Specific improvement recommendations")
    strengths: List[str] = Field(..., description="Resume strengths")
    weaknesses: List[str] = Field(..., description="Areas for improvement")

class RelevanceAnalysis(BaseModel):
    score: int = Field(..., description="Relevance score out of 20")
    matched: List[str] = Field(..., description="Matched skills from job description")
    missing: List[str] = Field(..., description="Missing critical skills")
    suggestion: str = Field(..., description="Specific improvement suggestion")

class ImpactAnalysis(BaseModel):
    quantification_score: int = Field(..., description="Quantification score out of 15")
    action_verbs_score: int = Field(..., description="Action verbs score out of 10")
    suggestion: str = Field(..., description="Impact improvement suggestion")

class ATSAnalysis(BaseModel):
    score: int = Field(..., description="ATS compatibility score out of 20")
    detected_sections: List[str] = Field(..., description="Detected resume sections")
    formatting_issues: List[str] = Field(..., description="Formatting problems found")
    suggestion: str = Field(..., description="ATS improvement suggestion")

class JobAlignmentAnalysis(BaseModel):
    score: int = Field(..., description="Job alignment score out of 25")
    match_status: str = Field(..., description="High/Medium/Low match status")
    suggestion: str = Field(..., description="Alignment improvement suggestion")
```

#### Database Schema (Prisma)
```prisma
model ResumeAnalysis {
  id             String         @id @default(uuid()) @db.Uuid
  userId         String         @db.Uuid
  title          String
  cloudinaryUrl  String
  jobDescription String
  resumeText     String?
  analysisResult Json?
  totalScore     Int
  status         AnalysisStatus @default(UPLOADED)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  user           User           @relation(fields: [userId], references: [id])
}

enum AnalysisStatus {
  UPLOADED
  PROCESSING
  COMPLETED
  FAILED
}
```

## 🔌 API Routes & Endpoints

### Resume Creation & Analysis

#### POST `/api/resume/create`
Creates a new resume analysis request with comprehensive error handling and fallback mechanisms.

**Request Format:**
- Content-Type: `multipart/form-data`
- Fields:
  - `resume`: File (PDF, DOC, DOCX)
  - `jobDescription`: String
  - `title`: String

**Processing Flow:**
```typescript
export const POST = async (req: Request) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 1. Authentication validation
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Form data parsing and validation
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string;
    const title = formData.get("title") as string;

    // 3. Zod schema validation
    const parsed = ResumeOptimizationRequestSchema.safeParse({
      title, resume: resumeFile, JobDescription: jobDescription
    });
    
    if (!parsed.success) {
      return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
    }

    // 4. File validation
    if (!resumeFile || resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Invalid file or size too large" }, { status: 400 });
    }

    // 5. Cloudinary upload with optimization
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadRes = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "resumes_ops",
          use_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryResponse);
        }
      ).end(buffer);
    });

    let resumeUrl = uploadRes.secure_url;
    resumeUrl = resumeUrl?.replace("/upload/", "/upload/f_jpg/");

    // 6. Database record creation
    const resumeId = uuidv4();
    const newResume = await prisma.resumeAnalysis.create({
      data: {
        id: resumeId,
        title: title,
        userId: session.user.id,
        resumeText: "",
        cloudinaryUrl: resumeUrl,
        jobDescription: jobDescription,
        totalScore: 0,
        status: "PROCESSING",
        updatedAt: new Date()
      }
    });

    // 7. Python API integration with fallback
    const pythonApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
    
    if (pythonApiUrl) {
      try {
        const pythonPayload = {
          resumeId: newResume.id,
          fileUrl: resumeUrl,
          JobDescription: jobDescription,
        };
        
        const pythonRes = await fetch(`${pythonApiUrl}/api/analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pythonPayload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!pythonRes.ok) {
          throw new Error(`Python API returned ${pythonRes.status}`);
        }
      } catch (fetchError) {
        // STRONG FALLBACK: Update status to FAILED immediately
        await prisma.resumeAnalysis.update({
          where: { id: newResume.id },
          data: { status: "FAILED", updatedAt: new Date() }
        });
      }
    } else {
      // No Python API URL configured
      await prisma.resumeAnalysis.update({
        where: { id: newResume.id },
        data: { status: "FAILED", updatedAt: new Date() }
      });
    }

    return NextResponse.json({
      success: true,     
      resumeId: newResume.id
    }, { status: 200 });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Error occurred while optimizing Resume";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
};
```

#### POST `/api/analysis` (Python Backend)
Processes resume analysis using AI and updates database with results.

**Request Body:**
```json
{
  "resumeId": "uuid-string",
  "fileUrl": "https://cloudinary-url",
  "JobDescription": "detailed job requirements"
}
```

**Processing Logic:**
```python
async def analyze(req: ResumeAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Receives request -> Starts Background Task -> Returns Immediately.
    """
    request_id = f"py_req_{int(time.time())}_{req.resumeId[:8]}"
    
    if not req.resumeId or not req.fileUrl:
        raise HTTPException(status_code=400, detail="Missing resumeId or fileUrl")

    # Fire and Forget background processing
    fileUrl = req.fileUrl.replace("/upload/f_jpg/", "/upload/")
    
    background_tasks.add_task(
        process_resume_analysis,
        req.resumeId,
        fileUrl,
        req.JobDescription
    )

    return {
        "success": True,
        "message": "Analysis started in background",
        "resumeId": req.resumeId,
        "status": "PROCESSING"
    }
```

### Resume Retrieval & Management

#### GET `/api/resume/all`
Retrieves all resume analyses for the authenticated user.

**Response:**
```json
{
  "success": true,
  "resumes": [
    {
      "id": "uuid-string",
      "title": "Software Engineer Resume",
      "totalScore": 85,
      "status": "COMPLETED",
      "createdAt": "2024-12-18T10:30:00Z",
      "jobDescription": "Full-stack developer position...",
      "analysisResult": { /* detailed analysis object */ }
    }
  ]
}
```

#### GET `/api/resume/[id]`
Retrieves specific resume analysis by ID.

#### DELETE `/api/resume/delete/[id]`
Deletes resume analysis and associated Cloudinary assets.

## 🎨 Frontend Components & UI

### Resume Analysis Display System

The frontend provides a comprehensive, real-time display system that handles all analysis states with elegant UI feedback.

#### Main Display Component
```typescript
const ResumeAnalysisDisplay = ({ resume, onRetry, retrying = false }: ResumeAnalysisDisplayProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Processing State with animated indicators
  if (resume.status === 'PROCESSING') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-12">
          <div className="text-center">
            <div className="mb-8">
              <div className="relative">
                <Spinner className="w-12 h-12 mx-auto mb-6 text-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full animate-ping"></div>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Analyzing Your Resume</h2>
              <p className="text-gray-600 mb-6">
                Our AI is carefully analyzing your resume against the job description. This usually takes 2-3 minutes.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                💡 We're evaluating your resume for relevance, formatting, keywords, and overall presentation quality.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-checking status every 3 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed State - Comprehensive Analysis Display
  if (resume.status === 'COMPLETED') {
    let analysisData: any = null;
    try {
      analysisData = typeof resume.analysisResult === 'string' 
        ? JSON.parse(resume.analysisResult) 
        : resume.analysisResult;
    } catch (error) {
      console.error('Error parsing analysis result:', error);
    }

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Overall Score Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(resume.totalScore)}`}>
              {resume.totalScore}
            </div>
            <div className="text-gray-500 text-lg mb-4">out of 100</div>
            <div className="w-64 bg-gray-100 rounded-full h-2 mx-auto mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getScoreBgColor(resume.totalScore)}`}
                style={{ width: `${resume.totalScore}%` }}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Overall Resume Score</h2>
            <p className="text-gray-600">Based on job requirements and best practices</p>
          </div>
        </div>

        {/* Job Description Context */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Job Description</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{resume.jobDescription}</p>
          </div>
        </div>

        {/* Detailed Analysis Results */}
        {analysisData && (
          <div className="space-y-6">
            {/* Executive Summary */}
            {analysisData.summary && (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed">{analysisData.summary}</p>
              </div>
            )}

            {/* Score Breakdown Grid */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills Relevance Card */}
                {analysisData.relevance && (
                  <div className="bg-white/80 border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Skills Relevance</h4>
                      <span className={`text-xl font-semibold ${
                        analysisData.relevance.score >= 16 ? 'text-green-600' : 
                        analysisData.relevance.score >= 12 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysisData.relevance.score}/20
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Matched Skills */}
                      {analysisData.relevance.matched?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Matched Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisData.relevance.matched.map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Missing Skills */}
                      {analysisData.relevance.missing?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">Missing Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisData.relevance.missing.map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysisData.relevance.suggestion && (
                        <p className="text-sm text-gray-600 mt-2">{analysisData.relevance.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Impact & Metrics Card */}
                {analysisData.impact && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Impact & Metrics</h4>
                      <span className={`text-lg font-bold ${
                        (analysisData.impact.quantification_score + analysisData.impact.action_verbs_score) >= 20 ? 'text-green-600' : 
                        (analysisData.impact.quantification_score + analysisData.impact.action_verbs_score) >= 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysisData.impact.quantification_score + analysisData.impact.action_verbs_score}/25
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Quantification:</span>
                        <span className="font-medium">{analysisData.impact.quantification_score}/15</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Action Verbs:</span>
                        <span className="font-medium">{analysisData.impact.action_verbs_score}/10</span>
                      </div>
                      {analysisData.impact.suggestion && (
                        <p className="text-sm text-gray-600 mt-2">{analysisData.impact.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ATS Compatibility Card */}
                {analysisData.ats_compatibility && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">ATS Compatibility</h4>
                      <span className={`text-lg font-bold ${
                        analysisData.ats_compatibility.score >= 16 ? 'text-green-600' : 
                        analysisData.ats_compatibility.score >= 12 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysisData.ats_compatibility.score}/20
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Detected Sections */}
                      {analysisData.ats_compatibility.detected_sections?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Detected Sections:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisData.ats_compatibility.detected_sections.map((section: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {section}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Formatting Issues */}
                      {analysisData.ats_compatibility.formatting_issues?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-orange-700 mb-1">Formatting Issues:</p>
                          <ul className="text-sm text-orange-600 space-y-1">
                            {analysisData.ats_compatibility.formatting_issues.map((issue: string, index: number) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-orange-500 mt-0.5">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Alignment Card */}
                {analysisData.jd_alignment && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Job Alignment</h4>
                      <span className={`text-lg font-bold ${
                        analysisData.jd_alignment.score >= 20 ? 'text-green-600' : 
                        analysisData.jd_alignment.score >= 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysisData.jd_alignment.score}/25
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Match Status:</span>
                        <span className={`font-medium px-2 py-1 rounded text-xs ${
                          analysisData.jd_alignment.match_status === 'High' ? 'bg-green-100 text-green-800' :
                          analysisData.jd_alignment.match_status === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analysisData.jd_alignment.match_status}
                        </span>
                      </div>
                      {analysisData.jd_alignment.suggestion && (
                        <p className="text-sm text-gray-600 mt-2">{analysisData.jd_alignment.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Extracted Resume Text (if available) */}
        {resume.resumeText && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Extracted Resume Text</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {resume.resumeText}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Failed State with comprehensive error handling
  if (resume.status === 'FAILED') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Analysis Failed</h2>
            <p className="text-gray-600 mb-8">
              We encountered an error while analyzing your resume. This could be due to file format issues, 
              temporary server problems, or the analysis service being unavailable.
            </p>

            <div className="bg-red-50 rounded-lg p-4 mb-8 text-left">
              <p className="text-red-800 text-sm">
                <strong>Common causes and solutions:</strong>
              </p>
              <ul className="text-red-700 text-sm mt-2 space-y-1">
                <li>• <strong>Service unavailable:</strong> The analysis service may be down. Try the retry button.</li>
                <li>• <strong>File format:</strong> Ensure your resume is in PDF, DOC, or DOCX format</li>
                <li>• <strong>File corruption:</strong> Check that the file isn't corrupted or password-protected</li>
                <li>• <strong>Timeout:</strong> Large files or complex layouts may cause timeouts</li>
                <li>• <strong>Network issues:</strong> Check your internet connection and try again</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/resumes'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Resumes
              </Button>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  disabled={retrying}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Retrying...' : 'Retry Analysis'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
```

### Resume Management Dashboard

#### Resume List Component
```typescript
const ResumesAnalysisComponent = () => {
  const { resumesAnalysis, loading } = useResumeConAll();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resumesAnalysis?.map((resume) => (
        <ResumeCard key={resume.id} resume={resume} />
      ))}
    </div>
  );
};

const ResumeCard = ({ resume }: { resume: ResumeContextDets }) => {
  const getStatusBadge = (status: string) => {
    const badges = {
      COMPLETED: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      PROCESSING: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
      FAILED: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      UPLOADED: { color: 'bg-gray-100 text-gray-800', text: 'Uploaded' }
    };
    return badges[status] || badges.UPLOADED;
  };

  const badge = getStatusBadge(resume.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{resume.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
        </div>
        
        {resume.status === 'COMPLETED' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Score</span>
              <span className={`text-lg font-bold ${
                resume.totalScore >= 80 ? 'text-green-600' : 
                resume.totalScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {resume.totalScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  resume.totalScore >= 80 ? 'bg-green-500' : 
                  resume.totalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${resume.totalScore}%` }}
              />
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {resume.jobDescription}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(resume.createdAt).toLocaleDateString()}
          </span>
          <Link 
            href={`/resumes/${resume.id}/analysis`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Analysis →
          </Link>
        </div>
      </div>
    </div>
  );
};
```

## 🔄 Real-time Status Updates

### Polling System
```typescript
const useResumeStatusPolling = (resumeId: string) => {
  const [resume, setResume] = useState<ResumeContextDets | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!resumeId || !polling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/resume/${resumeId}`);
        const data = await response.json();
        
        if (data.success) {
          setResume(data.resume);
          
          // Stop polling when analysis is complete or failed
          if (data.resume.status === 'COMPLETED' || data.resume.status === 'FAILED') {
            setPolling(false);
          }
        }
      } catch (error) {
        console.error('Error polling resume status:', error);
      }
    };

    // Initial fetch
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [resumeId, polling]);

  return { resume, polling, setPolling };
};
```

## 📊 Analytics & Performance Metrics

### Analysis Performance Tracking
```typescript
interface AnalysisMetrics {
  processingTime: number; // milliseconds
  fileSize: number; // bytes
  textExtractionTime: number; // milliseconds
  aiAnalysisTime: number; // milliseconds
  totalScore: number; // 0-100
  categoryScores: {
    relevance: number; // 0-20
    impact: number; // 0-25
    atsCompatibility: number; // 0-20
    essentials: number; // 0-10
    jobAlignment: number; // 0-25
  };
  userSatisfaction?: number; // 1-5 rating
  retryCount: number;
  errorType?: string;
}

const trackAnalysisMetrics = (metrics: AnalysisMetrics) => {
  // Send to analytics service
  analytics.track('Resume Analysis Completed', {
    ...metrics,
    timestamp: new Date().toISOString(),
    userId: session?.user?.id
  });
};
```

### Success Rate Monitoring
```typescript
interface SystemMetrics {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  averageScore: number;
  popularJobTypes: string[];
  commonFailureReasons: string[];
}

const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch('/api/analytics/resume-system');
  return response.json();
};
```

## 🔐 Security & Privacy

### Data Protection
- **File Encryption**: All uploaded files encrypted in transit and at rest
- **Access Control**: User-specific data isolation with JWT authentication
- **Data Retention**: Configurable retention policies for analysis results
- **GDPR Compliance**: Full data export and deletion capabilities

### Content Security
- **File Validation**: Strict MIME type and size validation
- **Virus Scanning**: Integration with security scanning services
- **Content Moderation**: Automated inappropriate content detection
- **Rate Limiting**: Upload frequency limitations to prevent abuse

## 🚀 Performance Optimization

### Caching Strategy
```typescript
// Redis caching for analysis results
const cacheAnalysisResult = async (resumeId: string, result: any) => {
  await redis.setex(`analysis:${resumeId}`, 3600, JSON.stringify(result)); // 1 hour cache
};

const getCachedAnalysisResult = async (resumeId: string) => {
  const cached = await redis.get(`analysis:${resumeId}`);
  return cached ? JSON.parse(cached) : null;
};
```

### Background Processing
- **Queue System**: Redis-based job queue for analysis processing
- **Worker Scaling**: Auto-scaling workers based on queue length
- **Progress Tracking**: Real-time progress updates via WebSocket
- **Error Recovery**: Automatic retry with exponential backoff

## 📈 Future Enhancements

### Planned Features (Q1 2025)
- **Multi-language Support**: Resume analysis in multiple languages
- **Industry-specific Analysis**: Tailored scoring for different industries
- **Resume Builder Integration**: AI-powered resume improvement suggestions
- **Batch Processing**: Analyze multiple resumes simultaneously
- **Advanced Visualizations**: Interactive charts and graphs for analysis results

### Technical Improvements
- **WebSocket Integration**: Real-time progress updates
- **Advanced Caching**: Intelligent caching with cache invalidation
- **Performance Monitoring**: Detailed performance metrics and alerting
- **A/B Testing**: Experiment with different analysis algorithms

## 📚 Additional Resources

- [Resume Analysis API Documentation](../api/resume/)
- [AI Analysis Models Documentation](./AI_ANALYSIS_MODELS.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Next Review**: January 2025  
**Maintained By**: Zerko Development Team  
**Contributors**: AI Analysis Team, Frontend Team, Backend Team