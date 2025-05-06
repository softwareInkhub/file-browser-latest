import { withAuth } from '../../../lib/auth';
import { getFileMetadata, shareFile, getUserByEmail, getUser } from '../../../lib/aws';

export default withAuth(async function handler(req, res) {
  const { userId } = req.user;
  
  // GET for listing shared users
  if (req.method === 'GET') {
    try {
      const { fileId, action } = req.query;
      
      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required' });
      }
      
      if (action !== 'list') {
        return res.status(400).json({ error: 'Invalid action' });
      }
      
      // Get file metadata
      const file = await getFileMetadata(fileId);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if user is the owner
      if (file.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view sharing details' });
      }
      
      // If there are no shared users, return an empty array
      if (!file.sharedWith || file.sharedWith.length === 0) {
        return res.status(200).json({ sharedUsers: [] });
      }
      
      // Get user data for each shared userId
      const sharedUsersPromises = file.sharedWith.map(sharedUserId => getUser(sharedUserId));
      const sharedUsersData = await Promise.all(sharedUsersPromises);
      
      // Return only the necessary user data
      const sharedUsers = sharedUsersData.map(user => ({
        userId: user.userId,
        email: user.email
      }));
      
      return res.status(200).json({ sharedUsers });
    } catch (error) {
      console.error('List shared users error:', error);
      return res.status(500).json({ error: 'Failed to list shared users' });
    }
  }
  
  // POST for sharing a file
  if (req.method === 'POST') {
    try {
      const { fileId, email } = req.body;
      
      if (!fileId || !email) {
        return res.status(400).json({ error: 'File ID and email are required' });
      }
      
      // Get file metadata
      const file = await getFileMetadata(fileId);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if user is the owner
      if (file.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to share this file' });
      }
      
      // Find the user to share with
      const targetUser = await getUserByEmail(email);
      
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Can't share with yourself
      if (targetUser.userId === userId) {
        return res.status(400).json({ error: 'You cannot share a file with yourself' });
      }
      
      // Share the file
      const updatedFile = await shareFile(fileId, userId, targetUser.userId);
      
      // Get user data for each shared userId
      const sharedUsersPromises = updatedFile.sharedWith.map(sharedUserId => getUser(sharedUserId));
      const sharedUsersData = await Promise.all(sharedUsersPromises);
      
      // Return only the necessary user data
      const sharedUsers = sharedUsersData.map(user => ({
        userId: user.userId,
        email: user.email
      }));
      
      return res.status(200).json({ 
        message: 'File shared successfully',
        sharedUsers
      });
    } catch (error) {
      console.error('Share file error:', error);
      return res.status(500).json({ error: 'Failed to share file' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
});
