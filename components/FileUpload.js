import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFile, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function FileUpload({ onFileUploaded, parentFolderId = null }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    // Set up simulated progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 90) return prev + 10;
        return prev;
      });
    }, 500);
    
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      console.log('Starting server-side upload process');
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add parentFolderId if specified
      if (parentFolderId) {
        formData.append('parentFolderId', parentFolderId);
        console.log('Adding parentFolderId to formData:', parentFolderId);
      } else {
        console.log('No parentFolderId to add to formData');
      }
      
      console.log('Sending file to server-side upload endpoint');
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const fileMetadata = await response.json();
      console.log('File uploaded successfully:', fileMetadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Set success state
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded(fileMetadata);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'An error occurred during the upload');
    } finally {
      clearInterval(progressInterval);
      if (!success) {
        setUploading(false);
      }
    }
  };
  
  const resetUpload = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div>
      {success ? (
        <div className="flex items-center">
          <button 
            onClick={resetUpload}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all duration-200 ease-in-out shadow-sm text-sm"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2 h-4 w-4" />
            <span>Upload Another</span>
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}
          
          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all duration-200 ease-in-out shadow-sm text-sm"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2 h-4 w-4" />
              <span>Upload</span>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
                disabled={uploading}
              />
            </button>
          ) : (
            <div className="border border-gray-200 rounded-md shadow-sm p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center min-w-0">
                  <div className="flex-shrink-0 bg-blue-50 p-1 rounded-md">
                    <FontAwesomeIcon icon={faFile} className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-2 flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex items-center">
                  {!uploading && (
                    <button
                      type="button"
                      onClick={resetUpload}
                      className="mr-2 text-gray-400 hover:text-gray-500"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="py-1.5 px-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all duration-200 ease-in-out shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading
                      </span>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} className="mr-1 h-4 w-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {uploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}