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
  name:string | null,
  post: string | null,
  jobDescription: string | null,
  resumeUrl: string| null,
  interviewType: string| null,
  questionsList: QuestionsList | null,
  resumeData:string | null,
  duration:string | null
}