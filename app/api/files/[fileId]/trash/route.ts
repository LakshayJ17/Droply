import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PATCH route for Trash
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

        // Fetch fileId from params
        const { fileId } = await props.params;

        if (!fileId) {
            return NextResponse.json({ error: "File ID is required" }, { status: 401 })
        }

        // Fetch the file from db - ensure it belongs to user
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
            return NextResponse.json({ error: "No file found" }, { status: 401 })
        }

        // Toggle the isTrash status (move to trash or restore)
        const [updatedFile] = await db
            .update(files)
            .set({ isTrash: !file.isTrash })
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId)
                )
            )
            .returning()

        const action = updatedFile.isTrash ? "moved to trash" : "restored";
        return NextResponse.json({
            ...updatedFile,
            message: `File ${action} successfully`,
        });



    } catch (error) {
        return NextResponse.json({ error: "Failed to update file (trash) " }, { status: 500 })
    }
}