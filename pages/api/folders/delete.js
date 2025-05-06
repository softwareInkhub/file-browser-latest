import { withAuth } from '../../../lib/auth';
import { deleteFolder } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { folderId } = req.body;
    const userId = req.user.userId;
    
    // Validate inputs
    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }
    
    // Delete the folder
    await deleteFolder(folderId, userId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return res.status(500).json({ error: 'Failed to delete folder: ' + error.message });
  }
});
