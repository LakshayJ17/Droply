import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, isNull } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server";

// API route to fetch files for the authenticated user
export async function GET(request: NextRequest) {
    try {
        // Authenticate the user
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get query parameters from the request URL
        const searchParams = request.nextUrl.searchParams
        const queryUserId = searchParams.get("userId")
        const parentId = searchParams.get("parentId")

        // Ensure the userId in the query matches the authenticated user
        if (!queryUserId || queryUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch files from the database
        let userFiles;
        if (parentId) {
            // If parentId is provided, fetch files from the specific folder
            userFiles = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.userId, userId),
                        eq(files.parentId, parentId)
                    )
                )
        } else {
            // If no parentId, fetch files from the root (no parent folder)
            userFiles = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.userId, userId),
                        isNull(files.parentId)
                    )
                )
        }
        return NextResponse.json(userFiles)
        
    } catch (error) {
        return NextResponse.json({ error: "Error fetching files" }, { status: 500 })
    }
}