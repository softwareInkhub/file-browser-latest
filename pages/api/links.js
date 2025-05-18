import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '../../lib/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const linksTable = process.env.DYNAMODB_LINKS_TABLE || 'links';

const ddbClient = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export default withAuth(async function handler(req, res) {
  const { userId } = req.user;

  if (req.method === 'POST') {
    const { name, url } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const item = { id, userId, name, url, createdAt };
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: linksTable,
        Item: item,
      }));
      return res.status(201).json(item);
    } catch (error) {
      console.error('Error saving link:', error);
      return res.status(500).json({ error: 'Failed to save link' });
    }
  }

  if (req.method === 'GET') {
    try {
      if (!userId) {
        console.error('No userId found in request');
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log('Fetching links for userId:', userId);
      const command = new ScanCommand({
        TableName: linksTable,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      });
      const data = await ddbDocClient.send(command);
      return res.status(200).json({ links: data.Items || [] });
    } catch (error) {
      console.error('Error fetching links:', error);
      return res.status(500).json({ error: 'Failed to fetch links' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }
    try {
      await ddbDocClient.send(new DeleteCommand({
        TableName: linksTable,
        Key: { id },
      }));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting link:', error);
      return res.status(500).json({ error: 'Failed to delete link' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}); 