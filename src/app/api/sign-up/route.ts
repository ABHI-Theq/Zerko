import prisma from "@/lib/prisma";
import { saltAndHashPassword } from "@/util/password";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<any> {
  const { firstname, lastname, email, password } = await req.json();

  try {
    console.log(firstname,lastname,email,password);
    
    let user = await prisma.user.findUnique({
      where: {
        email:email
      },
    });
    if (user) {
      return NextResponse.json({ error: "User already exists", status: 400 });
    }
    const hashedpassword=await saltAndHashPassword(password);

    user = await prisma.user.create({
      data: {
        name: `${firstname} ${lastname}`,
        email: email,
        password: hashedpassword,
      },
    });

    return NextResponse.json({
      user: user,
      status: 201,
    });

  } catch (error) {
    console.log(error);
    
    const errMsg =
      error instanceof Error
        ? error.message
        : "error occurred while signing up";
    return NextResponse.json({ error: errMsg, status: 500 });
  }
}
