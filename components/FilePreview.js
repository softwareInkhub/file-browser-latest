import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFile, faFileAlt, faFileImage, faFileCode, faFileVideo, faFileAudio, faFilePdf, faFileArchive, faSpinner, faDownload, faPencilAlt, faSave } from '@fortawesome/free-solid-svg-icons';

export default function FilePreview({ file, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Update editedContent when content changes
  useEffect(() => {
    if (content) {
      setEditedContent(content);
    }
  }, [content]);

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (!file) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/files/download?fileId=${file.fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate preview URL');
        }
        
        const data = await response.json();
        
        // Safety check - don't allow null or invalid URLs
        if (!data.url || data.url === 'null' || data.url === 'undefined') {
          throw new Error('Invalid preview URL generated');
        }
        
        setPreviewUrl(data.url);
        
        // For text files, try to fetch the actual content through our proxy API
        if (isTextFile(file.mimeType)) {
          // Use our proxy API to fetch the content and avoid CORS issues
          const token = localStorage.getItem('token');
          try {
            fetch(`/api/files/content?fileId=${file.fileId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Failed to fetch file content');
                }
                return response.json();
              })
              .then(data => {
                if (data.content) {
                  // Set the content to the actual file data
                  setContent(data.content);
                } else {
                  throw new Error('No content returned from server');
                }
              })
              .catch(err => {
                console.error('Error fetching file content:', err);
                if (file.mimeType === 'text/csv') {
                  setContent('Failed to load CSV content. Please download the file to view its contents.');
                } else {
                  setContent('Failed to load text content. Please download the file to view its contents.');
                }
              });
          } catch (err) {
            console.error('Error in fetch process:', err);
            if (file.mimeType === 'text/csv') {
              setContent('CSV files contain structured data that is best viewed in a spreadsheet application. ' +
                      'Download the file to view and analyze the data in your preferred application.');
            } else {
              setContent('Text preview is not available directly. Please download the file to view its contents.');
            }
          }
        }
        
      } catch (error) {
        console.error('Preview error:', error);
        setError('Failed to generate preview. Please try downloading the file directly.');
        // Even if there's an error, set a default message for text files
        if (isTextFile(file.mimeType)) {
          setContent('Preview unavailable. Please download the file to view its contents.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreviewUrl();
  }, [file]);
  
  // Close the modal when pressing Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  // Prevent body scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  const getFileIcon = () => {
    if (!file) return faFile;
    
    const mimeType = file.mimeType?.toLowerCase() || '';
    
    if (mimeType.includes('image')) return faFileImage;
    if (mimeType.includes('pdf')) return faFilePdf;
    if (mimeType.includes('video')) return faFileVideo;
    if (mimeType.includes('audio')) return faFileAudio;
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('javascript') || mimeType.includes('css') || mimeType.includes('html')) return faFileCode;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('x-rar')) return faFileArchive;
    
    return faFileAlt;
  };
  
  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };
  
  const isPdfFile = (mimeType) => {
    return mimeType === 'application/pdf';
  };
  
  const isTextFile = (mimeType) => {
    if (!mimeType) return false;
    
    return [
      'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json',
      'application/xml', 'text/csv', 'text/markdown', 'application/javascript'
    ].includes(mimeType) || mimeType.startsWith('text/');
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const isVideoFile = (mimeType) => {
    return mimeType && mimeType.startsWith('video/');
  };

  const isAudioFile = (mimeType) => {
    return mimeType && mimeType.startsWith('audio/');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // When saving, update the content
      setContent(editedContent);
    }
    setIsEditing(!isEditing);
  };

  const renderPreview = () => {
    if (!file) return null;
    
    // Handle case where we don't have a valid preview URL but still want to show information
    if (!previewUrl && !error) {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <FontAwesomeIcon icon={getFileIcon()} className="h-16 w-16 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{file.fileName}</h3>
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md mb-4 inline-block">
            <p className="text-sm font-medium">{file.mimeType}</p>
            <p className="text-xs">{formatFileSize(file.size)}</p>
          </div>
          <p className="text-gray-600 mb-6">
            Preview is not available for this file. Please download to view.
          </p>
        </div>
      );
    }
    
    // Image preview
    if (isImageFile(file.mimeType)) {
      return (
        <div className="p-4 flex justify-center">
          <img 
            src={previewUrl} 
            alt={file.fileName} 
            className="max-h-96 max-w-full object-contain" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = ''; // Clear the src
              setError('Failed to load image preview. This might be due to CORS restrictions or the image format is not supported by your browser.');
            }}
          />
        </div>
      );
    }
    
    // Video preview
    if (isVideoFile(file.mimeType)) {
      return (
        <div className="p-4 flex justify-center">
          <video 
            controls 
            className="max-h-96 max-w-full" 
            onError={(e) => {
              console.error('Video preview error:', e);
              setError('Failed to load video preview. This might be due to format restrictions or CORS policies.');
            }}
          >
            <source src={previewUrl} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Audio preview
    if (isAudioFile(file.mimeType)) {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <FontAwesomeIcon icon={faFileAudio} className="h-16 w-16 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{file.fileName}</h3>
          <div className="bg-gray-100 p-4 rounded-md mb-6 max-w-md mx-auto">
            <audio controls className="w-full" onError={() => setError('Failed to load audio preview.')}>
              <source src={previewUrl} type={file.mimeType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      );
    }
    
    // PDF preview
    if (isPdfFile(file.mimeType)) {
      return (
        <div className="p-4 h-96">
          <iframe 
            src={`${previewUrl}#view=FitH`} 
            className="w-full h-full border-0"
            title={file.fileName}
            onError={() => setError('Failed to load PDF preview. Please download the file to view it.')}
          ></iframe>
        </div>
      );
    }
    
    // Text file preview
    if (isTextFile(file.mimeType) && content !== null) {
      return (
        <div className="p-4">
          <div className="bg-gray-100 p-6 rounded-md">
            {/* Content preview/editor section */}
            <div className="border border-gray-300 rounded p-2 mb-4 bg-white overflow-auto" style={{ maxHeight: '400px' }}>
              {isEditing ? (
                <textarea 
                  className="w-full h-full min-h-[300px] text-sm font-mono" 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
              ) : (
                <pre className="text-sm whitespace-pre-wrap">{content}</pre>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Default - no preview, just file info with enhanced styling
    return (
      <div className="p-8 text-center">
        <div className="mb-6">
          <FontAwesomeIcon icon={getFileIcon()} className="h-16 w-16 text-blue-600" />
        </div>
        <p className="text-gray-600 mb-6">
          Preview is not available for this file type.
        </p>
      </div>
    );
  };
  
  if (!file) return null;
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4 sm:mx-auto shadow-xl transform transition-all flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={getFileIcon()} className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900 truncate max-w-lg">
              {file.fileName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>
        
        {/* File details */}
        <div className="px-6 py-2 bg-gray-50 text-sm flex flex-wrap gap-x-6 gap-y-1">
          <div>
            <span className="text-gray-500">Type:</span> <span className="text-gray-900">{file.mimeType || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500">Size:</span> <span className="text-gray-900">{formatFileSize(file.size)}</span>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading preview...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            renderPreview()
          )}
        </div>
        
        {/* Footer with download and edit buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {/* Edit button (only for text files) */}
          {isTextFile(file.mimeType) && content !== null && (
            <button
              onClick={handleEditToggle}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FontAwesomeIcon icon={isEditing ? faSave : faPencilAlt} className="mr-2 h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Edit Content'}
            </button>
          )}
          
          {/* Download button */}
          {previewUrl ? (
            <a
              href={previewUrl}
              download={file.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2 h-4 w-4" />
              Download
            </a>
          ) : (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
              disabled
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2 h-4 w-4" />
              Download Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
