import prisma from "@/lib/prisma";
import { saltAndHashPassword } from "@/util/password";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<any> {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { firstname, lastname, email, password } = body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    console.log("Sign-up attempt:", { firstname, lastname, email });
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: {
        email: email
      },
    });

    if (user) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedpassword = await saltAndHashPassword(password);

    // Create user
    user = await prisma.user.create({
      data: {
        name: `${firstname} ${lastname}`,
        email: email,
        password: hashedpassword,
        image: "/user.png"
      },
    });

    console.log("User created successfully:", {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        },
        success: true,
        message: "User created successfully"
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error during sign-up:", error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error occurred while signing up";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
