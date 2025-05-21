import {pgTable, text, uuid, integer, boolean, timestamp} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'


export const files = pgTable("files", {
    id: uuid("id").defaultRandom().primaryKey(),

    // basic file/folder info
    name: text("name").notNull(),
    path: text("path").notNull(),
    size: integer("size").notNull(),
    type: text("type").notNull(), // "folder"/"file"

    // Storage info
    fileUrl : text("file_url").notNull(), //url to access file
    thumbnailUrl: text("thumbnail_url"),

    // Ownership info 
    userId: text("user_id").notNull(),
    parentId: uuid("parent_id"), //Parent folder is (null for root items)

    // file/folder flags 
    isFolder : boolean("is_folder").default(false).notNull(),
    isStarred : boolean("is_starred").default(false).notNull(),
    isTrash : boolean("is_trash").default(false).notNull(),

    // Time stamps 
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

})

/*
parent: each file/folder can have one parent folder

children: each folder can have many child files/folders
*/

export const filesRelations = relations(files, ({one, many}) => ({
    parent: one(files, {
        fields: [files.parentId],
        references: [files.id]
    }),

    //  relationship to child files/folder
    children: many(files)
}))

// Type definitions

export const File = typeof files.$inferSelect