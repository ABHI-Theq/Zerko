import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest,{params}:{params:{id:string}}){
    const {id}=params;


    try {
        
        if(!id){
            return NextResponse.json({
                error:"Error fetching slug",
                status:400
            })
        }

        const interview=await prisma.interview.findFirst({
            where:{
                id:id
            }
        })

        return NextResponse.json({
            interview:interview,
            status:200
        })

    } catch (error) {
        const errMsg=error instanceof Error?error.message:"Error fetching Interview details"
        return NextResponse.json({
            error:errMsg,
            status:500
        })        
    }
}

export async function DELETE(req: NextRequest,{params}:{params:{id:string}}){
    const {id}=params;

    try {
         if(!id){
            return NextResponse.json({
                error:"Error fetching slug",
                status:400
            })
        }
        const interview=await prisma.interview.delete({
            where:{
                id:id
            }
        })
    } catch (error) {
        
    }
}