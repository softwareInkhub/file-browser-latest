import { withAuth } from '../../../lib/auth';
import { getFileMetadata, getPresignedDownloadUrl } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { fileId } = req.query;
    const { userId } = req.user;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    // Get file metadata
    const file = await getFileMetadata(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user has access to this file
    if (file.userId !== userId && (!file.sharedWith || !file.sharedWith.includes(userId))) {
      return res.status(403).json({ error: 'You do not have permission to download this file' });
    }
    
    // Generate a pre-signed download URL
    const url = await getPresignedDownloadUrl(file.s3Key);
    
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
});
