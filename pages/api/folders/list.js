import { withAuth } from '../../../lib/auth';
import { listFolders } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const userId = req.user.userId;
    const { parentFolderId } = req.query;
    
    // List folders for the current user
    const folders = await listFolders(userId, parentFolderId);
    
    return res.status(200).json(folders);
  } catch (error) {
    console.error('List folders error:', error);
    return res.status(500).json({ error: 'Failed to list folders: ' + error.message });
  }
});
