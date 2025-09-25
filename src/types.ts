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
enum InterviewType {
  TECHNICAL,
  BEHAVIORAL,
  SYSTEM_DESIGN,
  HR
}

export const InterviewCreationSchema=z.object({
    userId: z.string(),
    post:z.string(),
    jobdescription:z.string(),
    interviewtype: InterviewType,
    resume:z.string()
})

export type InterviewCreation=z.infer<typeof InterviewCreationSchema>