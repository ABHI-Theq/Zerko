import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const DELETE = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const {id} =await params;

        await prisma.resumeAnalysis.deleteMany({
            where: {
                id: id,
                userId: session.user.id,
            },
        });
        return NextResponse.json({ message: "Resume deleted successfully" }, { status: 200 });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Error deleting resume";
        return NextResponse.json({ error: errMsg }, { status: 500 });
    }
};