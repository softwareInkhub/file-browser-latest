import { withAuth } from '../../../lib/auth';
import { getFileMetadata, getPresignedDownloadUrl } from '../../../lib/aws';
// Next.js API routes have global fetch available

// This endpoint acts as a proxy to fetch file content and avoid CORS issues
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId } = req.query;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    // Get file metadata
    const fileData = await getFileMetadata(fileId);
    
    if (!fileData) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user has access to the file
    const userId = req.user.userId;
    if (fileData.userId !== userId && !fileData.sharedWith?.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get the download URL
    const downloadUrl = await getPresignedDownloadUrl(fileData.s3Key);
    
    // Fetch the file content from S3
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    
    // Get the content
    const content = await response.text();
    
    // Send the content
    res.status(200).json({ content });
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ error: 'Failed to fetch file content' });
  }
}

export default withAuth(handler);
