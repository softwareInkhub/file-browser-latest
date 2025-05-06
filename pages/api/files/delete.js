import { withAuth } from '../../../lib/auth';
import { deleteFile } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { fileId } = req.query;
    const { userId } = req.user;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    // Delete the file (this function checks ownership internally)
    await deleteFile(fileId, userId);
    
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    
    if (error.message === 'File not found or you do not have permission to delete') {
      return res.status(403).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});
