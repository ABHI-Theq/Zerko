import { NextResponse } from "next/server";

export { auth as middleware } from "@/lib/auth";

// export const auth=(req)=>{
// const {nextUrl}=req;
//  const isLoggedIn=req.auth as NextResponse;
//  if(isLoggedIn){

//  }else{

//  }
// }

const config={
    matcher:[
        ""
    ]
}