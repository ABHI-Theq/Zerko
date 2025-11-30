import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'profile-images',
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Update user image in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: uploadResult.secure_url }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile image updated successfully",
        imageUrl: uploadResult.secure_url,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
