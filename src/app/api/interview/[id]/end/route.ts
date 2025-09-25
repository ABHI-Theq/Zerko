import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req:NextRequest,{params}:{params:{id:string}}){
    const {id}=params;

    try {
        const interview=await prisma.interview.update({
            where:{
                id:id
            },
            data:{status:"ENDED"}
        })
    } catch (error) {
        
    }
    }