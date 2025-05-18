import { withAuth } from '../../../lib/auth';
import { listUserFiles } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('Listing files for user:', req.user);
    const { userId } = req.user;
    
    if (!userId) {
      console.error('No userId found in auth token');
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get the parentFolderId from query parameters if available
    const { parentFolderId } = req.query;
    
    // Get all files for the user (both owned and shared)
    console.log('Calling listUserFiles with userId:', userId, 'parentFolderId:', parentFolderId || 'null');
    const files = await listUserFiles(userId, parentFolderId || null);
    console.log('Files retrieved:', files ? 'Success' : 'Null or undefined');
    
    // Add more detailed logging to see structure of returned files
    console.log('Files structure:', {
      hasOwnedFiles: files && Array.isArray(files.ownedFiles),
      ownedFilesCount: files && files.ownedFiles ? files.ownedFiles.length : 0,
      hasSharedFiles: files && Array.isArray(files.sharedFiles),
      sharedFilesCount: files && files.sharedFiles ? files.sharedFiles.length : 0,
      sampleFile: files && files.ownedFiles && files.ownedFiles.length > 0 ? 
        Object.keys(files.ownedFiles[0]) : 'No files found'
    });
    
    // Always return the correct structure
    return res.status(200).json({
      ownedFiles: Array.isArray(files?.ownedFiles) ? files.ownedFiles : [],
      sharedFiles: Array.isArray(files?.sharedFiles) ? files.sharedFiles : []
    });
  } catch (error) {
    console.error('List files error:', error);
    return res.status(500).json({ error: 'Failed to list files' });
  }
});
