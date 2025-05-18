import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// AWS configuration
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;
const filesTable = process.env.DYNAMODB_FILES_TABLE;
const usersTable = process.env.DYNAMODB_USERS_TABLE;

// Log AWS configuration (without revealing full credentials)
console.log('AWS configuration:', {
  region,
  accessKeyIdExists: !!accessKeyId,
  secretAccessKeyExists: !!secretAccessKey,
  bucketName,
  filesTable,
  usersTable
});

// Initialize S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Generate a pre-signed URL for uploading a file
export async function getPresignedUploadUrl(userId, fileName, contentType, fileId) {
  try {
    console.log('Generating presigned URL with params:', {
      userId, 
      fileId, 
      fileName, 
      contentType,
      bucketName
    });
    
    if (!bucketName) {
      throw new Error('S3 bucket name is not configured');
    }
    
    // Store all user files in a single folder with the userId
    // Using a sanitized filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${userId}/${timestamp}-${sanitizedFileName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: contentType,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated presigned URL successfully');
    
    return {
      url,
      s3Key,
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

// Generate a pre-signed URL for downloading a file
export async function getPresignedDownloadUrl(s3Key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Delete a file from S3
export async function deleteFileFromS3(s3Key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });
  
  return s3Client.send(command);
}

// Save file metadata to DynamoDB
export async function saveFileMetadata(fileData) {
  // Make sure we're using id as the primary key
  const fileItem = {
    ...fileData,
    id: fileData.fileId, // Use fileId as the id primary key
    isReadOnly: true,
    createdAt: new Date().toISOString(),
  };

  const command = new PutCommand({
    TableName: filesTable,
    Item: fileItem,
  });
  
  return ddbDocClient.send(command);
}

// Get file metadata from DynamoDB
export async function getFileMetadata(fileId) {
  const command = new GetCommand({
    TableName: filesTable,
    Key: {
      id: fileId, // Assuming files table also uses id as primary key
    },
  });
  
  const response = await ddbDocClient.send(command);
  return response.Item;
}

// List all files for a user (both owned and shared)
export async function listUserFiles(userId, parentFolderId = null) {
  // Prepare filter expressions for files and folders in the current folder
  let filterExpression = 'userId = :userId';
  let expressionAttributeValues = {
    ':userId': userId,
  };
  
  // Add parentFolderId filter if specified (for folder navigation)
  if (parentFolderId !== undefined && parentFolderId !== null) {
    filterExpression += ' AND parentFolderId = :parentFolderId';
    expressionAttributeValues[':parentFolderId'] = parentFolderId;
  } else {
    // For root level, we need files with parentFolderId = 'root'
    filterExpression += ' AND parentFolderId = :rootValue';
    expressionAttributeValues[':rootValue'] = 'root';
  }
  
  // Use scan for owned files in the current folder
  const ownedFilesCommand = new ScanCommand({
    TableName: filesTable,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  });
  
  // Use scan for shared files as well
  const sharedFilesCommand = new ScanCommand({
    TableName: filesTable,
    FilterExpression: 'contains(sharedWith, :userId)',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  });
  
  const [ownedFilesResponse, sharedFilesResponse] = await Promise.all([
    ddbDocClient.send(ownedFilesCommand),
    ddbDocClient.send(sharedFilesCommand),
  ]);
  
  return {
    ownedFiles: ownedFilesResponse.Items || [],
    sharedFiles: sharedFilesResponse.Items || [],
  };
}

// Share a file with another user
export async function shareFile(fileId, ownerId, targetUserId) {
  const file = await getFileMetadata(fileId);
  
  if (!file || file.userId !== ownerId) {
    throw new Error('File not found or you do not have permission to share');
  }
  
  const sharedWith = new Set(file.sharedWith || []);
  sharedWith.add(targetUserId);
  
  const command = new UpdateCommand({
    TableName: filesTable,
    Key: {
      id: fileId,
    },
    UpdateExpression: 'SET sharedWith = :sharedWith',
    ExpressionAttributeValues: {
      ':sharedWith': Array.from(sharedWith),
    },
    ReturnValues: 'ALL_NEW',
  });
  
  const response = await ddbDocClient.send(command);
  return response.Attributes;
}

// Delete a file (metadata from DynamoDB and the actual file from S3)
export async function deleteFile(fileId, userId) {
  const file = await getFileMetadata(fileId);
  
  if (!file || file.userId !== userId) {
    throw new Error('File not found or you do not have permission to delete');
  }
  
  // Delete from S3
  await deleteFileFromS3(file.s3Key);
  
  // Delete metadata from DynamoDB
  const command = new DeleteCommand({
    TableName: filesTable,
    Key: {
      id: fileId,
    },
  });
  
  return ddbDocClient.send(command);
}

// Create a new user in DynamoDB
export async function createUser(userData) {
  try {
    // Make sure we're using id as the primary key
    const userItem = {
      ...userData,
      id: userData.userId, // Use userId as the id primary key
      createdAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: usersTable,
      Item: userItem,
      ConditionExpression: 'attribute_not_exists(id)',
    });
    
    return await ddbDocClient.send(command);
  } catch (error) {
    // If the table doesn't exist yet, log and rethrow a more specific error
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found. Please create the users table first:', usersTable);
      throw new Error('Database setup required. Please contact the administrator.');
    }
    throw error;
  }
}

// Get user data from DynamoDB
export async function getUser(userId) {
  try {
    const command = new GetCommand({
      TableName: usersTable,
      Key: {
        id: userId, // Using id as the primary key
      },
    });
    
    const response = await ddbDocClient.send(command);
    return response.Item;
  } catch (error) {
    // If the table doesn't exist yet, just return null
    if (error.name === 'ResourceNotFoundException') {
      console.log('DynamoDB users table not found. Returning null for user ID:', userId);
      return null;
    }
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email) {
  try {
    // Use scan instead of query if no EmailIndex exists
    const command = new ScanCommand({
      TableName: usersTable,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });
    
    const response = await ddbDocClient.send(command);
    return response.Items?.[0];
  } catch (error) {
    // If the table doesn't exist yet, just return null
    // This allows new user registration to work even if the table isn't set up yet
    if (error.name === 'ResourceNotFoundException') {
      console.log('DynamoDB table not found. Returning null for email query:', email);
      return null;
    }
    throw error;
  }
}

// Folder related functions

// Create virtual folder in S3 (we just save a special marker object)
export async function createFolder(userId, folderName, parentFolderId = null) {
  try {
    // Sanitize folder name (remove slashes and other problematic chars)
    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9-_. ]/g, '_');
    const folderId = uuidv4();
    
    // Determine the folder path
    let folderPath;
    if (parentFolderId) {
      // Get parent folder info to construct the path
      const parentFolder = await getFolderInfo(parentFolderId);
      if (!parentFolder) throw new Error('Parent folder not found');
      
      folderPath = `${parentFolder.s3Key}${sanitizedFolderName}/`;
    } else {
      // Root-level folder
      folderPath = `${userId}/${sanitizedFolderName}/`;
    }
    
    // Create a marker object in S3 (empty file with special metadata)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${folderPath}.folder`, // Use .folder suffix to mark this as a special folder object
      Body: '', // Empty content
      ContentType: 'application/x-directory',
      Metadata: {
        'is-folder': 'true',
      },
    });
    
    await s3Client.send(command);
    
    // Save folder metadata to DynamoDB (using the files table with a special type)
    const folderData = {
      fileId: folderId,
      fileName: sanitizedFolderName,
      s3Key: folderPath,
      size: 0,
      mimeType: 'application/x-directory',
      userId,
      parentFolderId: parentFolderId ? String(parentFolderId) : 'root',
      isFolder: true,
      sharedWith: [],
      createdAt: new Date().toISOString(),
    };
    
    // Save the folder info to DynamoDB
    await saveFileMetadata(folderData);
    
    return folderData;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

// List folders for a user
export async function listFolders(userId, parentFolderId = null) {
  // Use scan with a filter for folders belonging to this user
  const command = new ScanCommand({
    TableName: filesTable,
    FilterExpression: 'userId = :userId AND isFolder = :isFolder AND parentFolderId = :parentFolderId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':isFolder': true,
      ':parentFolderId': parentFolderId ? String(parentFolderId) : 'root',
    },
  });
  
  const response = await ddbDocClient.send(command);
  return response.Items || [];
}

// Get folder information
export async function getFolderInfo(folderId) {
  const command = new GetCommand({
    TableName: filesTable,
    Key: {
      id: folderId,
    },
  });
  
  const response = await ddbDocClient.send(command);
  return response.Item;
}

// Delete a folder (and optionally its contents)
export async function deleteFolder(folderId, userId) {
  // First, get the folder metadata
  const folder = await getFolderInfo(folderId);
  
  if (!folder || folder.userId !== userId) {
    throw new Error('Folder not found or you do not have permission to delete it');
  }
  
  if (!folder.isFolder) {
    throw new Error('The specified item is not a folder');
  }
  
  // Delete the folder marker from S3
  const s3DeleteCommand = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: `${folder.s3Key}.folder`,
  });
  
  await s3Client.send(s3DeleteCommand);
  
  // Delete folder metadata from DynamoDB
  const ddbDeleteCommand = new DeleteCommand({
    TableName: filesTable,
    Key: {
      id: folderId,
    },
  });
  
  await ddbDocClient.send(ddbDeleteCommand);
  
  return { success: true };
}

// Rename a file
export async function renameFile(fileId, newFileName, userId) {
  try {
    // First, get the file metadata
    const file = await getFileMetadata(fileId);
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    if (file.userId !== userId) {
      return { success: false, error: 'You do not have permission to rename this file' };
    }
    
    // Sanitize the new file name
    const sanitizedFileName = newFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Check if the file is a folder
    if (file.isFolder) {
      // For folders, we just need to update the metadata in DynamoDB
      const command = new UpdateCommand({
        TableName: filesTable,
        Key: { id: fileId },
        UpdateExpression: 'SET fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': sanitizedFileName,
        },
        ReturnValues: 'ALL_NEW',
      });
      
      const response = await ddbDocClient.send(command);
      return { success: true, file: response.Attributes };
    } else {
      // For files, we need to copy the file in S3 with a new key
      // Extract the path from the current S3 key
      const s3KeyParts = file.s3Key.split('/');
      const currentFileName = s3KeyParts.pop();
      const path = s3KeyParts.join('/');
      
      // Generate a new key with the same timestamp prefix
      let newS3Key;
      if (currentFileName.includes('-')) {
        const timestampPrefix = currentFileName.split('-')[0];
        newS3Key = `${path}/${timestampPrefix}-${sanitizedFileName}`;
      } else {
        // If no timestamp in the current name, add a new one
        const timestamp = Date.now();
        newS3Key = `${path}/${timestamp}-${sanitizedFileName}`;
      }
      
      // Update the file metadata in DynamoDB
      const command = new UpdateCommand({
        TableName: filesTable,
        Key: { id: fileId },
        UpdateExpression: 'SET fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': sanitizedFileName,
        },
        ReturnValues: 'ALL_NEW',
      });
      
      const response = await ddbDocClient.send(command);
      return { success: true, file: response.Attributes };
    }
  } catch (error) {
    console.error('Error renaming file:', error);
    return { success: false, error: error.message };
  }
}

// Move a file to a different folder
export async function moveFile(fileId, destinationFolderId, userId) {
  try {
    // Get the file metadata
    const file = await getFileMetadata(fileId);
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    if (file.userId !== userId) {
      return { success: false, error: 'You do not have permission to move this file' };
    }
    
    // If destination folder ID is provided, validate it
    let destinationFolder = null;
    if (destinationFolderId) {
      destinationFolder = await getFolderInfo(destinationFolderId);
      
      if (!destinationFolder) {
        return { success: false, error: 'Destination folder not found' };
      }
      
      if (destinationFolder.userId !== userId) {
        return { success: false, error: 'You do not have permission to move to this folder' };
      }
      
      if (!destinationFolder.isFolder) {
        return { success: false, error: 'Destination is not a folder' };
      }
      
      // Check if we're trying to move a folder into itself or one of its descendants
      if (file.isFolder) {
        // Get all ancestor folders of the destination folder
        let currentFolder = destinationFolder;
        while (currentFolder) {
          if (currentFolder.id === fileId) {
            return { success: false, error: 'Cannot move a folder into itself or its descendant' };
          }
          
          if (!currentFolder.parentFolderId) break;
          
          currentFolder = await getFolderInfo(currentFolder.parentFolderId);
        }
      }
    }
    
    // Update the parentFolderId in DynamoDB
    const command = new UpdateCommand({
      TableName: filesTable,
      Key: { id: fileId },
      UpdateExpression: 'SET parentFolderId = :parentFolderId',
      ExpressionAttributeValues: {
        ':parentFolderId': destinationFolderId ? String(destinationFolderId) : 'root',
      },
      ReturnValues: 'ALL_NEW',
    });
    
    const response = await ddbDocClient.send(command);
    return { success: true, file: response.Attributes };
  } catch (error) {
    console.error('Error moving file:', error);
    return { success: false, error: error.message };
  }
}
