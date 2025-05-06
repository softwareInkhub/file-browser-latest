import { withAuth } from '../../../lib/auth';
import { getFolderInfo } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { folderId } = req.query;
    
    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }
    
    // Get folder info
    const folder = await getFolderInfo(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Check if user has permission to view this folder
    const { userId } = req.user;
    if (folder.userId !== userId && !folder.sharedWith?.includes(userId)) {
      return res.status(403).json({ error: 'You do not have permission to view this folder' });
    }
    
    return res.status(200).json(folder);
  } catch (error) {
    console.error('Get folder info error:', error);
    return res.status(500).json({ error: 'Failed to get folder information' });
  }
});
