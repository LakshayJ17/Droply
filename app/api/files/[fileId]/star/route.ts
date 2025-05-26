import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PATCH endpoint to toggle the "starred" status of a file for the authenticated user
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ fileId: string }> }
) {
    try {
        // Authenticate the user
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Extract fileId from route parameters
        const { fileId } = await props.params;

        if (!fileId) {
            return NextResponse.json({ error: "File id is required" }, { status: 401 })
        }

        // Fetch the file from the database, ensuring it belongs to the user
        const [file] = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId)
                )
            )

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 401 })
        }

        // Toggle the star status (if starred, unstar; if not starred, star)
        const updatedFiles = await db
            .update(files)
            .set({ isStarred: !file.isStarred })
            .where(and(
                eq(files.id, fileId),
                eq(files.userId, userId)
            ))
            .returning() // Return the updated file

        const updatedFile = updatedFiles[0]

        return NextResponse.json(updatedFile)

    } catch (error) {
        return NextResponse.json({ error: "Failed to update the file (star)" }, { status: 500 })
    }
}