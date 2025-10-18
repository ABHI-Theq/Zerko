import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {auth} from "@/lib/auth"

export async function GET(req: NextRequest) {
         const session = await auth();
    try {
        
        const interviews=await prisma.interview.findMany({
            where:{
                userId:session?.user?.id
            }
        })
        return NextResponse.json(
            { interviews, status: 200 },
            { status: 200 }
        );
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Error occurred while fetching interviews";
        return NextResponse.json(
            { error: errMsg, status: 500 },
            { status: 500 }
        );
    }
}