import { verifyToken } from '../../../lib/auth';
import { moveFile } from '../../../lib/aws';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Enhanced auth verification - get token from Authorization header or cookies
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Using token from Authorization header');
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Using token from cookies');
    }

    // Verify the token
    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    console.log('Token found, verifying...');
    const user = verifyToken(token);
    if (!user) {
      console.log('Invalid or expired token');
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    console.log('User authenticated:', user.userId);

    const { fileId, destinationFolderId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Move the file (passing 'root' as destinationFolderId means moving to root)
    const result = await moveFile(fileId, destinationFolderId ? String(destinationFolderId) : 'root', user.userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Return success response
    return res.status(200).json({ message: 'File moved successfully', file: result.file });
  } catch (error) {
    console.error('File move error:', error);
    return res.status(500).json({ error: 'Failed to move file' });
  }
}
