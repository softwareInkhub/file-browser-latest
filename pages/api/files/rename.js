import { verifyToken } from '../../../lib/auth';
import { renameFile } from '../../../lib/aws';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fileId, newFileName } = req.body;

    if (!fileId || !newFileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Rename the file
    const result = await renameFile(fileId, newFileName, user.userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Return success response
    return res.status(200).json({ message: 'File renamed successfully', file: result.file });
  } catch (error) {
    console.error('File rename error:', error);
    return res.status(500).json({ error: 'Failed to rename file' });
  }
}
