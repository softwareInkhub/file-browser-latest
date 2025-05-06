import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AuthGuard from '../../components/AuthGuard';
// Sidebar is now included in Layout component
import FileUpload from '../../components/FileUpload';
import FileList from '../../components/FileList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import FolderCreate from '../../components/FolderCreate';

export default function FolderView() {
  const router = useRouter();
  const { folderId } = router.query;
  
  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchInitiated, setFetchInitiated] = useState(false);
  
  const fetchFolder = async () => {
    if (!folderId || fetchInitiated) return;
    
    setFetchInitiated(true);
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        throw new Error('Authentication token missing. Please login again.');
      }
      
      // Fetch folder info and files in parallel
      const [folderResponse, filesResponse] = await Promise.all([
        fetch(`/api/folders/info?folderId=${folderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`/api/files/list?parentFolderId=${folderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      if (!folderResponse.ok) {
        throw new Error('Folder not found or access denied');
      }
      
      if (!filesResponse.ok) {
        throw new Error('Failed to fetch folder contents');
      }
      
      const folderData = await folderResponse.json();
      const filesData = await filesResponse.json();
      
      setFolder(folderData);
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching folder details:', error);
      setError(error.message || 'Failed to load folder contents. Please try again.');
      setFiles({ ownedFiles: [], sharedFiles: [] });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('Current folderId from router:', folderId, typeof folderId);
    // Reset fetch state when folderId changes
    if (folderId) {
      if (!fetchInitiated) {
        fetchFolder();
      }
    } else {
      setFetchInitiated(false);
    }
    
    // Cleanup function to reset state when component unmounts or folderId changes
    return () => {
      setFetchInitiated(false);
    };
  }, [folderId]);
  
  const handleFileUploaded = async (fileData) => {
    console.log('File uploaded in folder view:', fileData);
    // Check if the uploaded file's parentFolderId matches current folder
    if (fileData && fileData.parentFolderId === folderId) {
      console.log('File correctly associated with current folder');
    } else {
      console.log('Warning: Uploaded file not associated with current folder');
      console.log('Current folder ID:', folderId);
      console.log('File parentFolderId:', fileData?.parentFolderId || 'null');
    }
    
    // Reset the fetch state so we can get fresh data
    setFetchInitiated(false);
    // Then fetch the folder data again
    await fetchFolder();
  };
  
  return (
    <AuthGuard>
      <Layout title={folder ? `Folder: ${folder.fileName}` : 'Loading Folder...'}>
        <div className="flex flex-col space-y-2 sm:space-y-6 mx-0 px-0">
              <div className="mb-6 px-2 sm:px-0 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <button 
                      onClick={() => router.push('/dashboard')} 
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      &larr; Back to Dashboard
                    </button>
                  </div>
                  <h1 className="text-2xl font-semibold mb-1">
                    {folder ? folder.fileName : 'Loading Folder...'}
                  </h1>
                  <p className="text-gray-500">
                    {loading ? 'Loading...' : 'Manage your files and folders'}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <FileUpload 
                    onFileUploaded={handleFileUploaded} 
                    parentFolderId={folderId}
                  />
                </div>
              </div>

              {folderId && typeof folderId === 'string' && (
                <div className="mb-4 px-2 sm:px-0">
                  <FolderCreate 
                    onFolderCreated={handleFileUploaded}
                    currentFolderId={folderId}
                  />
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                  {error}
                </div>
              )}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-gray-500">Loading folder contents...</div>
                </div>
              ) : (
                <FileList 
                  files={files} 
                  refreshFiles={() => {
                    setFetchInitiated(false);
                    fetchFolder();
                  }} 
                  initialFolder={folder}
                  initialFolderPath={[folder]}
                  parentFolderId={folderId}
                />
              )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
