import { withAuth } from '../../../lib/auth';
import { saveFileMetadata } from '../../../lib/aws';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';

// AWS configuration
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;

console.log('Upload API - AWS configuration checking:', {
  regionExists: !!region,
  accessKeyIdExists: !!accessKeyId,
  secretAccessKeyExists: !!secretAccessKey,
  bucketNameExists: !!bucketName,
});

// Initialize S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Disable the default Next.js body parser, as we're using formidable for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse the form data
const parseForm = async (req) => {
  const options = {
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB limit
    multiples: false,
  };
  
  const form = formidable(options);
  
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return reject(err);
      }
      resolve([fields, files]);
    });
  });
};

export default withAuth(async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Server-side upload request received');
  console.log('User authenticated:', req.user.userId);
  
  try {
    const userId = req.user.userId;
    
    console.log('Parsing form data...');
    // Parse the form data
    const [fields, filesObj] = await parseForm(req);
    
    console.log('Form parsed, files:', Object.keys(filesObj));
    console.log('Form fields received:', fields);
    
    // Check if parentFolderId exists in form data
    if (fields.parentFolderId) {
      console.log('parentFolderId found in form data:', fields.parentFolderId);
    } else {
      console.log('No parentFolderId found in form data');
    }
    
    // With the new formidable, files is an object with the field name as the key
    console.log('Files object keys:', Object.keys(filesObj));
    
    // Handle different formidable response structures
    let file;
    
    if (filesObj.file) {
      // Check if file is an array (as seen in the logs)
      if (Array.isArray(filesObj.file)) {
        console.log('File is an array, using first item');
        file = filesObj.file[0];
      } else {
        console.log('File is an object');
        file = filesObj.file;
      }
    } else if (filesObj.files && filesObj.files[0]) {
      file = filesObj.files[0];
    } else {
      // Try getting the first value as a last resort
      const firstKey = Object.keys(filesObj)[0];
      if (firstKey) {
        const firstValue = filesObj[firstKey];
        file = Array.isArray(firstValue) ? firstValue[0] : firstValue;
      }
    }
    
    console.log('Extracted file object:', file ? 'Found' : 'Not found');
    
    if (!file) {
      console.error('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if we have all the required properties
    if (!file.filepath || !file.originalFilename) {
      console.error('Invalid file object - missing required properties');
      console.log('File properties available:', Object.keys(file));
      return res.status(400).json({ error: 'Invalid file format - missing required properties' });
    }
    
    console.log('File received on server:', {
      name: file.originalFilename,
      type: file.mimetype,
      size: file.size,
      path: file.filepath,
    });
    
    // Generate a unique file ID
    const fileId = uuidv4();
    
    // Create S3 key with just the user ID folder (for better organization)
    // Using a sanitized filename to prevent issues with special characters
    // We'll add a timestamp prefix to avoid filename conflicts
    const timestamp = Date.now();
    const sanitizedFileName = file.originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${userId}/${timestamp}-${sanitizedFileName}`;
    
    console.log('Uploading to S3 with key:', s3Key);
    
    // Read the file from disk
    const fileContent = fs.readFileSync(file.filepath);
    
    // Upload directly to S3 from the server
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: file.mimetype || 'application/octet-stream', // Fallback content type
    });
    
    await s3Client.send(command);
    console.log('File uploaded successfully to S3');
    
    // Get parentFolderId if it exists in the form data
    let parentFolderId = null;
    
    // Check fields format - it could be an object with a value property or directly the value
    if (fields.parentFolderId) {
      if (typeof fields.parentFolderId === 'object' && fields.parentFolderId.value) {
        parentFolderId = fields.parentFolderId.value;
        console.log('Found parentFolderId as object with value:', parentFolderId);
      } else if (typeof fields.parentFolderId === 'string') {
        parentFolderId = fields.parentFolderId;
        console.log('Found parentFolderId as string:', parentFolderId);
      } else {
        console.log('Found parentFolderId in unknown format:', fields.parentFolderId);
        parentFolderId = String(fields.parentFolderId);
      }
    }
    
    // Save file metadata to DynamoDB
    const fileData = {
      fileId,
      fileName: file.originalFilename,
      s3Key,
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      userId,
      parentFolderId, // Add the parentFolderId
      sharedWith: [],
      createdAt: new Date().toISOString(),
    };
    
    console.log('Saving file metadata to DynamoDB');
    await saveFileMetadata(fileData);
    console.log('File metadata saved successfully');
    
    // Clean up the temp file
    try {
      fs.unlinkSync(file.filepath);
      console.log('Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
      // Non-blocking error, continue execution
    }
    
    return res.status(201).json(fileData);
  } catch (error) {
    console.error('Server-side upload error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to upload file: ' + (error.message || 'Unknown error'),
      details: error.stack
    });
  }
});
