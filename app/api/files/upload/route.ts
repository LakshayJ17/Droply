import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm"
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid"

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""
})

// For file upload 

export async function POST(request: NextRequest) {
    try {
        // Authenticate the user
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse form data from the request
        const formData = await request.formData()
        const file = formData.get("file") as File
        const formUserId = formData.get("userId") as string
        const parentId = formData.get("parentId") as string || null

        // Ensure the user making the request matches the authenticated user
        if (formUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if a file was uploaded
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 401 })
        }

        // If parentId is provided, check if the parent folder exists and belongs to the user
        if (parentId) {
            const [parentFolder] = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.id, parentId),
                        eq(files.userId, userId),
                        eq(files.isFolder, true)
                    )
                )
            // (Optional) You could check if parentFolder exists here
        }

        // If parentId is not valid, return error
        if (!parentId) {
            return NextResponse.json({ error: "Parent folder not found" }, { status: 401 })
        }

        // Only allow image and PDF uploads
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            return NextResponse.json({ error: "Only images and pdf are supported" }, { status: 401 })
        }

        // Convert file to buffer for upload
        const buffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(buffer)

        // Set the folder path for ImageKit upload
        const folderPath = parentId ? `/droply/${userId}/folder/${parentId}` : `/droply/${userId}`

        const originalFileName = file.name;
        const fileExtension = originalFileName.split(".").pop() || ""

        // TODO: Add validation for empty extension and block certain extensions (e.g., exe, php)

        // Generate a unique file name
        const uniqueFileName = `${uuidv4()}.${fileExtension}`

        // Upload the file to ImageKit
        const uploadResponse = await imagekit.upload({
            file: fileBuffer,
            fileName: uniqueFileName,
            folder: folderPath,
            useUniqueFileName: false
        })

        // Prepare file data for database insertion
        const fileData = {
            name: originalFileName,
            path: uploadResponse.filePath,
            size: file.size,
            type: file.type,
            fileUrl: uploadResponse.url,
            thumbnailUrl: uploadResponse.thumbnailUrl || null,
            userId: userId,
            parentId: parentId,
            isFolder: false,
            isStarred: false,
            isTrash: false
        }
        // Insert the new file record into the database
        const [newFile] = await db.insert(files).values(fileData).returning()

        return NextResponse.json(newFile)
    } catch (error) {
        // Handle errors and respond with a failure message
        return NextResponse.json({ error: "Failed to upload file" }, { status: 401 })
    }
}