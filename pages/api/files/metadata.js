import { withAuth } from '../../../lib/auth';
import { saveFileMetadata, getFileMetadata, getPresignedDownloadUrl } from '../../../lib/aws';

export default async function handler(req, res) {
  // Public GET for file metadata (for shared links)
  if (req.method === 'GET') {
    try {
      const { fileId } = req.query;
      if (!fileId) {
        return res.status(400).json({ error: 'Missing fileId' });
      }
      const file = await getFileMetadata(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      // Only allow access if file is shared (sharedWith is array and has at least one user)
      if (!Array.isArray(file.sharedWith) || file.sharedWith.length === 0) {
        return res.status(403).json({ error: 'File is not shared' });
      }
      // Optionally, add a presigned download URL
      let downloadUrl = null;
      if (file.s3Key) {
        downloadUrl = await getPresignedDownloadUrl(file.s3Key);
      }
      return res.status(200).json({ file: { ...file, downloadUrl } });
    } catch (error) {
      console.error('Error fetching file metadata:', error);
      return res.status(500).json({ error: 'Failed to fetch file metadata' });
    }
  }

  // Allow POST for saving metadata (auth required)
  return withAuth(async function authedHandler(req, res) {
    if (req.method === 'POST') {
      try {
        console.log('Received metadata save request');
        const fileData = req.body;
        const { userId } = req.user;
        
        console.log('File metadata received:', {
          fileId: fileData.fileId,
          fileName: fileData.fileName,
          s3Key: fileData.s3Key ? (fileData.s3Key.substring(0, 20) + '...') : 'missing',
          size: fileData.size,
          mimeType: fileData.mimeType,
          userId: fileData.userId,
        });
        
        // Validate input
        if (!fileData.fileId || !fileData.fileName || !fileData.s3Key) {
          console.error('Missing required fields in metadata');
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Ensure the userId in the token matches the metadata
        if (fileData.userId !== userId) {
          console.error('User ID mismatch:', { tokenUserId: userId, metadataUserId: fileData.userId });
          return res.status(403).json({ error: 'Unauthorized - user ID mismatch' });
        }
        
        console.log('Saving file metadata to DynamoDB...');
        // Save the file metadata
        await saveFileMetadata(fileData);
        console.log('File metadata saved successfully');
        
        return res.status(201).json(fileData);
      } catch (error) {
        console.error('Save metadata error:', error);
        return res.status(500).json({ error: 'Failed to save file metadata: ' + error.message });
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  })(req, res);
}
