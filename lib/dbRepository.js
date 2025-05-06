import { db } from './db';
import { schema } from './db';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// User-related functions

/**
 * Get a user by their userId
 */
export async function getUser(userId) {
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.userId, userId));
    
    return user || null;
  } catch (error) {
    console.error('Error fetching user by userId:', error);
    return null;
  }
}

/**
 * Get a user by their email
 */
export async function getUserByEmail(email) {
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    
    return user || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData) {
  try {
    // If userId is not provided, generate one
    if (!userData.userId) {
      userData.userId = uuidv4();
    }
    
    const [newUser] = await db
      .insert(schema.users)
      .values(userData)
      .returning();
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

// File-related functions

/**
 * Save file metadata to the database
 */
export async function saveFileMetadata(fileData) {
  try {
    // If fileId is not provided, generate one
    if (!fileData.fileId) {
      fileData.fileId = uuidv4();
    }
    
    const [newFile] = await db
      .insert(schema.files)
      .values(fileData)
      .returning();
    
    return newFile;
  } catch (error) {
    console.error('Error saving file metadata:', error);
    throw new Error('Failed to save file metadata');
  }
}

/**
 * Get file metadata by fileId
 */
export async function getFileMetadata(fileId) {
  try {
    const [file] = await db
      .select()
      .from(schema.files)
      .where(eq(schema.files.fileId, fileId));
    
    return file || null;
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    return null;
  }
}

/**
 * List files owned by a user and shared with them
 */
export async function listUserFiles(userId) {
  try {
    // Get user's own files
    const ownedFiles = await db
      .select()
      .from(schema.files)
      .where(eq(schema.files.userId, userId));
    
    // Get files shared with the user
    const sharedFilesQuery = await db
      .select({
        fileId: schema.fileShares.fileId,
      })
      .from(schema.fileShares)
      .where(eq(schema.fileShares.sharedWithId, userId));
    
    // Extract file IDs
    const sharedFileIds = sharedFilesQuery.map(row => row.fileId);
    
    // If there are no shared files, return just the owned files
    if (sharedFileIds.length === 0) {
      return { ownedFiles, sharedFiles: [] };
    }
    
    // Get the full file metadata for shared files
    const sharedFiles = await db
      .select()
      .from(schema.files)
      .where(sql`${schema.files.fileId} IN (${sharedFileIds.join(',')})`)
    
    return { ownedFiles, sharedFiles };
  } catch (error) {
    console.error('Error listing user files:', error);
    return { ownedFiles: [], sharedFiles: [] };
  }
}

/**
 * Share a file with another user
 */
export async function shareFile(fileId, ownerId, targetEmail) {
  try {
    // First, get the target user by email
    const targetUser = await getUserByEmail(targetEmail);
    if (!targetUser) {
      throw new Error('User not found');
    }
    
    // Check if file exists and is owned by ownerId
    const [file] = await db
      .select()
      .from(schema.files)
      .where(eq(schema.files.fileId, fileId))
      .where(eq(schema.files.userId, ownerId));
    
    if (!file) {
      throw new Error('File not found or you do not have permission');
    }
    
    // Check if already shared
    const [existingShare] = await db
      .select()
      .from(schema.fileShares)
      .where(eq(schema.fileShares.fileId, fileId))
      .where(eq(schema.fileShares.sharedWithId, targetUser.userId));
    
    if (existingShare) {
      throw new Error('File already shared with this user');
    }
    
    // Create the share
    await db
      .insert(schema.fileShares)
      .values({
        fileId,
        ownerId,
        sharedWithId: targetUser.userId,
      });
    
    // Get all users this file is shared with (for response)
    const sharedUsers = await db
      .select({
        userId: schema.users.userId,
        email: schema.users.email,
      })
      .from(schema.fileShares)
      .leftJoin(schema.users, eq(schema.fileShares.sharedWithId, schema.users.userId))
      .where(eq(schema.fileShares.fileId, fileId));
    
    return { success: true, sharedUsers };
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(fileId, userId) {
  try {
    // Check if file exists and is owned by userId
    const [file] = await db
      .select()
      .from(schema.files)
      .where(eq(schema.files.fileId, fileId))
      .where(eq(schema.files.userId, userId));
    
    if (!file) {
      throw new Error('File not found or you do not have permission');
    }
    
    // Delete all shares first (due to foreign key constraints)
    await db
      .delete(schema.fileShares)
      .where(eq(schema.fileShares.fileId, fileId));
    
    // Delete the file record
    await db
      .delete(schema.files)
      .where(eq(schema.files.fileId, fileId));
    
    return { success: true, s3Key: file.s3Key };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
