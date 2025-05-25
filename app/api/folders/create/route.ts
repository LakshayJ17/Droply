import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid"

// API route to handle folder creation
export async function POST(request: NextRequest) {
    try {
        // Get the authenticated user's ID
        const { userId } = auth();
        if (!userId) {
            // If not authenticated, return 401
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse the request body
        const body = await request.json();
        const { name, userId: bodyUserId, parentId = null } = body

        // Ensure the userId in the body matches the authenticated user
        if (bodyUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Validate folder name
        if (!name || typeof name !== 'string' || name.trim() === "") {
            return NextResponse.json({ error: "Folder name is required" }, { status: 401 })
        }

        // If a parentId is provided, check if the parent folder exists and belongs to the user
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

            // If parent folder not found, return 401
            if (!parentFolder) {
                return NextResponse.json({ error: "Parent folder not found" }, { status: 401 })
            }
        }

        // Prepare folder data for insertion
        const folderData = {
            id: uuidv4(), // Unique folder ID
            name: name.trim(),
            path: `/folders/${userId}/${uuidv4()}`, // Folder path
            size: 0,
            type: "folder",
            fileUrl: "",
            thumbnailUrl: null,
            userId,
            parentId,
            isFolder: true,
            isStarred : false,
            isTrash: false
        }

        // Insert the new folder into the database and return the created folder
        const [newFolder] = await db.insert(files).values(folderData).returning()

        // Respond with success and the new folder data
        return NextResponse.json({
            success: true,
            message: "Folder created successfully",
            folder: newFolder
        })

    } catch (error) {
        // Handle unexpected errors
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}