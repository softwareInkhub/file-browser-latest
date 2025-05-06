import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AuthGuard from '../components/AuthGuard';
import FileList from '../components/FileList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareAlt, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export default function SharedFiles() {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let token;
      try {
        token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      } catch (e) {
        console.warn('Unable to access localStorage:', e);
      }
      
      if (!token) {
        console.log('No token found, redirecting to login page');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 500);
        return;
      }
      
      const response = await fetch('/api/files/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication error, redirecting to login');
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 500);
          }
          return;
        }
        throw new Error('Failed to fetch files');
      }
      
      const data = await response.json();
      // Show only shared files on this page
      setFiles({
        ownedFiles: [], // We don't show owned files here
        sharedFiles: data.sharedFiles || []
      });
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load shared files. Please try again or login again.');
      setFiles({ ownedFiles: [], sharedFiles: [] });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFiles();
  }, []);
  
  return (
    <Layout title="Shared Files - Secure File Storage">
      <AuthGuard>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold flex items-center">
                    <FontAwesomeIcon icon={faShareAlt} className="mr-3 h-5 w-5" />
                    Shared Files
                  </h1>
                  <p className="text-purple-100 text-sm mt-1">
                    Files shared with you by other users
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 h-5 w-5 mr-3 mt-0.5" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}
              
              {!loading && files && files.sharedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-4">
                    <FontAwesomeIcon icon={faShareAlt} className="h-12 w-12 mb-4" />
                    <p>No files have been shared with you yet.</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    When someone shares a file with you, it will appear here.
                  </p>
                </div>
              ) : (
                <FileList 
                  files={files} 
                  refreshFiles={fetchFiles} 
                  viewMode="grid" 
                  isOwner={false} 
                  isSharedView={true} 
                />
              )}
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
