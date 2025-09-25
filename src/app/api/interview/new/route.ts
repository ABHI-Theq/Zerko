import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST: Create a new interview
export async function POST(req: NextRequest) {
    try {
        const { post, userId, file  ,jobdescription, interviewType, duration } = await req.json();

        // Validate required fields
        if (!userId || !post || !jobdescription || !interviewType || !duration) {
            return NextResponse.json(
                { error: "Missing required fields", status: 400 },
                { status: 400 }
            );
        }

        const newInterview = await prisma.interview.create({
            data: {
                userId: userId,
                post: post as string,
                jobDescription: jobdescription,
                interviewType: interviewType,
                startedAt: new Date(),
                duration: duration,
            }
        });

        return NextResponse.json(
            { interviewDets: newInterview, status: 201 },
            { status: 201 }
        );
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Error occurred while creating interview";
        return NextResponse.json(
            { error: errMsg, status: 500 },
            { status: 500 }
        );
    }
}

