import { withAuth } from '../../../lib/auth';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

// AWS configuration
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;
const filesTable = process.env.DYNAMODB_FILES_TABLE;
const usersTable = process.env.DYNAMODB_USERS_TABLE;

// Initialize clients
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const dynamoClient = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export default withAuth(async function handler(req, res) {
  try {
    console.log('Debug API - AWS check');
    console.log('Checking AWS configuration:', {
      region,
      accessKeyIdExists: !!accessKeyId,
      secretAccessKeyExists: !!secretAccessKey,
      bucketName,
      filesTable,
      usersTable,
    });
    
    // Test S3 connection
    console.log('Testing S3 connection...');
    let s3Status = 'Unknown';
    try {
      const s3Command = new ListBucketsCommand({});
      const s3Response = await s3Client.send(s3Command);
      console.log('S3 connection successful, buckets:', s3Response.Buckets.map(b => b.Name).join(', '));
      s3Status = 'Connected';
    } catch (s3Error) {
      console.error('S3 connection error:', s3Error);
      s3Status = `Error: ${s3Error.message}`;
    }
    
    // Test DynamoDB connections
    console.log('Testing DynamoDB connection...');
    let dynamoFilesStatus = 'Unknown';
    let dynamoUsersStatus = 'Unknown';
    
    if (filesTable) {
      try {
        const filesCommand = new DescribeTableCommand({ TableName: filesTable });
        await dynamoClient.send(filesCommand);
        console.log('DynamoDB files table connection successful');
        dynamoFilesStatus = 'Connected';
      } catch (filesError) {
        console.error('DynamoDB files table error:', filesError);
        dynamoFilesStatus = `Error: ${filesError.message}`;
      }
    } else {
      dynamoFilesStatus = 'Not configured';
    }
    
    if (usersTable) {
      try {
        const usersCommand = new DescribeTableCommand({ TableName: usersTable });
        await dynamoClient.send(usersCommand);
        console.log('DynamoDB users table connection successful');
        dynamoUsersStatus = 'Connected';
      } catch (usersError) {
        console.error('DynamoDB users table error:', usersError);
        dynamoUsersStatus = `Error: ${usersError.message}`;
      }
    } else {
      dynamoUsersStatus = 'Not configured';
    }
    
    return res.status(200).json({
      success: true,
      aws: {
        region,
        s3: {
          bucketName,
          status: s3Status,
        },
        dynamodb: {
          filesTable,
          filesStatus: dynamoFilesStatus,
          usersTable,
          usersStatus: dynamoUsersStatus,
        },
      },
      user: req.user,
    });
  } catch (error) {
    console.error('AWS check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
