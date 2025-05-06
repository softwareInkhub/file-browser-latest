import { withAuth } from '../../../lib/auth';
import { getPresignedUploadUrl } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { fileName, contentType, fileId } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!fileName || !contentType || !fileId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate a pre-signed URL for upload
    const { url, s3Key } = await getPresignedUploadUrl(userId, fileName, contentType, fileId);
    
    return res.status(200).json({ url, s3Key });
  } catch (error) {
    console.error('Presign upload error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});
