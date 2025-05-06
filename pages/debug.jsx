import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import AuthGuard from '../components/AuthGuard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function DebugPage() {
  const [awsStatus, setAwsStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check AWS connectivity when the page loads
    checkAwsConnection();
  }, []);

  async function checkAwsConnection() {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch('/api/debug/aws-check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`AWS check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAwsStatus(data);
    } catch (err) {
      console.error('AWS check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    
    const file = fileInputRef.current?.files[0];
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    setLoading(true);
    setError(null);
    setUploadResult(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/debug/simple-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setUploadResult(data);
      fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <Layout title="Debug Tools">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
          
          {/* AWS Connection Status */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">AWS Connection Status</h2>
              <button
                onClick={checkAwsConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {loading && <p className="text-gray-500">Loading...</p>}
            
            {awsStatus && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">S3 Status</h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p><span className="font-medium">Bucket:</span> {awsStatus.aws.s3.bucketName || 'Not configured'}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={awsStatus.aws.s3.status === 'Connected' ? 'text-green-600' : 'text-red-600'}>
                        {awsStatus.aws.s3.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">DynamoDB Status</h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p><span className="font-medium">Files Table:</span> {awsStatus.aws.dynamodb.filesTable || 'Not configured'}</p>
                    <p><span className="font-medium">Files Table Status:</span> 
                      <span className={awsStatus.aws.dynamodb.filesStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}>
                        {awsStatus.aws.dynamodb.filesStatus}
                      </span>
                    </p>
                    <p><span className="font-medium">Users Table:</span> {awsStatus.aws.dynamodb.usersTable || 'Not configured'}</p>
                    <p><span className="font-medium">Users Table Status:</span> 
                      <span className={awsStatus.aws.dynamodb.usersStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}>
                        {awsStatus.aws.dynamodb.usersStatus}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Debug Upload */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Debug File Upload</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {uploadResult && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-3 h-5 w-5 mt-0.5" />
                <div>
                  <p className="text-green-700 font-medium">File uploaded successfully!</p>
                  <p className="text-sm text-green-600 mt-1">
                    {uploadResult.file.name} ({uploadResult.file.size} bytes)
                  </p>
                  <p className="text-xs text-green-600 mt-1">S3 Key: {uploadResult.file.s3Key}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4 file:rounded-md
                           file:border-0 file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                disabled={loading}
              >
                {loading ? 'Uploading...' : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Upload Test File
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
