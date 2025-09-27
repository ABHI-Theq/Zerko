import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
    const {id}=params;

    try {
        if(!id){
            return NextResponse.json({
                error:"No interview Id Provided",
                status:404
            })  
        }

        const interview=await prisma.interview.delete({
            where:{
                id:id
            }
        })

        return NextResponse.json({
            success:true,
            message:"Interview deleted successfully"
        })
    } catch (error) {
        const errMsg=error instanceof Error?error.message:"Error while deleting the interview"
        return NextResponse.json({
            error:errMsg,status:500
        })
    }
}