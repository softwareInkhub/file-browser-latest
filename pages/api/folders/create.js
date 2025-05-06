import { withAuth } from '../../../lib/auth';
import { createFolder } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { folderName, parentFolderId } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Create the folder
    const folder = await createFolder(userId, folderName, parentFolderId);
    
    return res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    return res.status(500).json({ error: 'Failed to create folder: ' + error.message });
  }
});
