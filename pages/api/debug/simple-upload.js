import { withAuth } from '../../../lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// AWS configuration
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;

// Initialize S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Disable the default Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Debug simple upload started');
  
  try {
    const userId = req.user.userId;
    const contentType = req.headers['content-type'];
    
    // Safety check - only proceed if it's a multipart form
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ 
        error: 'Invalid content type',
        receivedContentType: contentType || 'none',
        expected: 'multipart/form-data'
      });
    }

    // Parse form with formidable
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit for testing
    });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return reject(err);
        }
        resolve([fields, files]);
      });
    });
    
    console.log('Parsed form data, files keys:', Object.keys(files));
    
    // Handle different formidable response structures
    let file;
    
    if (files.file) {
      // Check if file is an array (as seen in the logs)
      if (Array.isArray(files.file)) {
        console.log('Debug: File is an array, using first item');
        file = files.file[0];
      } else {
        console.log('Debug: File is an object');
        file = files.file;
      }
    } else {
      // Try getting the first value as a last resort
      const firstKey = Object.keys(files)[0];
      if (firstKey) {
        const firstValue = files[firstKey];
        file = Array.isArray(firstValue) ? firstValue[0] : firstValue;
      }
    }
    
    console.log('Debug: Extracted file?', !!file);
    
    if (!file) {
      console.error('Debug: No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Verify we have all required properties
    if (!file.filepath || !file.originalFilename) {
      console.error('Debug: Invalid file object - missing properties');
      console.log('Debug: File properties available:', Object.keys(file));
      return res.status(400).json({ 
        error: 'Invalid file format - missing required properties',
        available: Object.keys(file)
      });
    }
    
    console.log('File details:', {
      name: file.originalFilename,
      type: file.mimetype,
      size: file.size,
    });
    
    // Generate a simplified S3 key for this test
    const fileId = uuidv4();
    const s3Key = `debug-uploads/${userId}/${fileId}-${file.originalFilename}`;
    
    // Read file from disk
    const fileContent = fs.readFileSync(file.filepath);
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: file.mimetype || 'application/octet-stream',
    });
    
    const s3Response = await s3Client.send(command);
    console.log('S3 upload success, response:', s3Response);
    
    return res.status(200).json({
      success: true,
      file: {
        name: file.originalFilename,
        type: file.mimetype,
        size: file.size,
        s3Key
      }
    });
  } catch (error) {
    console.error('Debug upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
