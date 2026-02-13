import { Dispatch, SetStateAction } from "react"
import {z} from "zod"

export const userSignupSchema=z.object({
    firstname:z.string().min(2,"firstname should be atleast of 2 characters"),
    lastname:z.string().min(2,"firstname should be atleast of 2 characters"),
    email:z.email("Invalid email address"),
    password:z.string().min(6,"password should be minimun of 6 characters of length")
})

export type UserSignup=z.infer<typeof userSignupSchema>

export const userSigninSchema=z.object({
    email:z.email("Invalid Email address"),
    password:z.string().min(6,"password should be minimum of 6 characters of length")
})

export type UserSignin=z.infer<typeof userSigninSchema>

export enum InterviewType {
  TECHNICAL = "TECHNICAL",
  BEHAVIORAL = "BEHAVIORAL",
  SYSTEM_DESIGN = "SYSTEM_DESIGN",
  HR = "HR"
}

export const InterviewCreationSchema=z.object({
    post:z.string()
      .min(1, "Post is required")
      .refine(val => /^[a-zA-Z\s]+$/.test(val), {
        message: "Post must contain only letters and spaces"
      }),
    jobDescription:z.string(),
    resume:z
      .any()
      .refine(
        (file) =>
          file &&
          typeof file === "object" &&
          "type" in file &&
          (
            file.type === "application/pdf" ||
            file.type === "application/msword" ||
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ),
        {
          message: "Only PDF, DOC, or DOCX files are allowed",
        }
      ),
    interviewType:z.enum(InterviewType),
    duration:z.number()
})

export type InterviewCreation=z.infer<typeof InterviewCreationSchema>

// src/types/questions.ts
export interface InterviewQuestion {
  id: number;
  question: string;
}

// src/validation/questionsSchema.ts
// Only validate questions list
export const QuestionsListSchema = z.array(
  z.object({
    id: z.number(),
    question: z.string().min(5, "Question must be at least 5 characters")
  })
).nonempty("Questions must be generated");

// TypeScript type
export type QuestionsList = z.infer<typeof QuestionsListSchema>;

export const QuestionSchema = z.object({
  id: z.number(),
  question: z.string().min(5, "Question is too short"),
});

export type Question = z.infer<typeof QuestionSchema>;

export type InterviewDetails={
  id:string | null,
  name:string | null,
  post: string | null,
  jobDescription: string | null,
  resumeUrl: string| null,
  interviewType: string| null,
  questionsList: QuestionsList | null,
  resumeData:string | null,
  duration:string | null
}

export type InterviewDetsForAPI={
   id: string | null,
  name: string | null,
  post: string | null,
  jobDescription: string | null,   
  resume :string | null,
  interviewType: string | null,
  duration: string | null,
  questions: QuestionsList | null,
  transcript: transcriptTypeMsg[] | null,
  feedback: string | null,
  feedbackGenerated: boolean | null,
  feedbackStr: string | null,
  improvements: string[] | null,
  overall_rating: number | null,
  strengths: string[] | null,
  createdAt: Date | null
}

export type transcriptTypeMsg={
  role:string,
  content:string
}

//resum optimization types
export const ResumeOptimizationRequestSchema=z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
    resume: z.any().refine(
        (file) =>
          file &&
          typeof file === "object" &&
          "type" in file &&
          (
            file.type === "application/pdf" ||
            file.type === "application/msword" ||
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ),
        {
          message: "Only PDF, DOC, or DOCX files are allowed",
        }
      ),
    JobDescription:z.string().min(10,"Job Description must be at least 10 characters")
})

// Resume Analysis Types (matching Python AnalysisModels.py)
export interface SkillGap {
  score: number;
  matched: string[];
  missing: string[];
  suggestion: string;
}

export interface ImpactAnalysis {
  quantification_score: number;
  action_verbs_score: number;
  suggestion: string;
}

export interface ATSCheck {
  score: number;
  detected_sections: string[];
  formatting_issues: string[];
}

export interface Essentials {
  score: number;
  contact_info_present: boolean;
  links_present: boolean;
}

export interface JobAlignment {
  score: number;
  match_status: string;
  suggestion: string;
}

export interface AnalysisResult {
  total_score: number;
  summary: string;
  relevance: SkillGap;
  impact: ImpactAnalysis;
  ats_compatibility: ATSCheck;
  essentials: Essentials;
  jd_alignment: JobAlignment;
}

export type ResumeContextDets={
  id: string,
  userId: string,
  title: string,
  resumeText: string | null,
  cloudinaryUrl: string,
  jobDescription: string,
  analysisResult: AnalysisResult | null,
  totalScore: number,
  status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED",
  createdAt?: string,
  updatedAt?: string
}

export interface InterviewContextType {
  interviews: InterviewDetsForAPI[];
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setInterviews: Dispatch<SetStateAction<InterviewDetsForAPI[]>>;
  refetchInterviews: () => Promise<void>;
}