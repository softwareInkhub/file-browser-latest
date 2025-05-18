import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFile,
  faFileAlt,
  faFilePdf,
  faFileImage,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faEllipsisV,
  faDownload,
  faShare,
  faTrash,
  faEye,
  faPen,
  faFolderPlus,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import ShareModal from './ShareModal';
import FilePreview from './FilePreview';
import MoveFileModal from './MoveFileModal';

export default function FileItem({ file, viewMode, isOwner = true, refreshFiles }) {
  // Set isOwner to true by default for backward compatibility
  // Add debugging to check what file data is being received
  console.log('FileItem received file:', {
    fileId: file?.fileId,
    fileName: file?.fileName,
    mimeType: file?.mimeType,
    size: file?.size,
    hasSharedWith: file?.sharedWith ? 'yes' : 'no',
    isOwner
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 10 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  const getFileIcon = () => {
    if (!file.mimeType) return faFile;
    
    try {
      if (file.mimeType.includes('pdf')) return faFilePdf;
      if (file.mimeType.includes('image')) return faFileImage;
      if (file.mimeType.includes('audio')) return faFileAudio;
      if (file.mimeType.includes('video')) return faFileVideo;
      if (file.mimeType.includes('zip') || file.mimeType.includes('x-tar') || file.mimeType.includes('x-rar')) return faFileArchive;
      if (file.mimeType.includes('text') || file.mimeType.includes('javascript') || file.mimeType.includes('json') || file.mimeType.includes('xml') || file.mimeType.includes('html')) return faFileCode;
      if (file.mimeType.includes('text/plain')) return faFileAlt;
    } catch (e) {
      console.warn('Error determining file icon:', e);
    }
    
    return faFile;
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      console.warn('Date format error:', e);
      return dateStr;
    }
  };
  
  const handleDownload = async () => {
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
        throw new Error('Failed to get download URL');
      }
      
      const { url } = await response.json();
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/delete?fileId=${file.fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      // Refresh the file list
      if (refreshFiles) {
        refreshFiles();
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete file');
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  };
  
  const handleShare = () => {
    setMenuOpen(false);
    setShowShareModal(true);
  };
  
  const handlePreview = () => {
    setMenuOpen(false);
    setShowPreview(true);
  };

  const handleRename = () => {
    setMenuOpen(false);
    const newName = prompt('Enter new file name:', file.fileName);
    if (!newName || newName === file.fileName) return;
    
    setLoading(true);
    setError(null);
    
    // Get file extension (if any)
    const extension = file.fileName.includes('.') ? 
      file.fileName.substring(file.fileName.lastIndexOf('.')) : '';
      
    // Add extension to new name if it doesn't have one
    const finalName = newName.includes('.') ? newName : newName + extension;
    
    // Call API to rename file
    const token = localStorage.getItem('token');
    fetch(`/api/files/rename`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileId: file.fileId,
        newFileName: finalName
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to rename file');
      return response.json();
    })
    .then(() => {
      if (refreshFiles) refreshFiles();
    })
    .catch(error => {
      console.error('Rename error:', error);
      setError('Failed to rename file');
    })
    .finally(() => {
      setLoading(false);
    });
  };
  
  const handleMoveToFolder = () => {
    setMenuOpen(false);
    setShowMoveModal(true);
  };
  
  const handleMove = async (destinationFolderId) => {
    setShowMoveModal(false);
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Moving file:', file.fileId, 'to folder:', destinationFolderId);
      
      // Call API to move file
      const moveResponse = await fetch('/api/files/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',  // Include cookies for authentication
        body: JSON.stringify({
          fileId: file.fileId,
          destinationFolderId: destinationFolderId ? String(destinationFolderId) : 'root'
        })
      });
      
      if (!moveResponse.ok) {
        const errorData = await moveResponse.json();
        console.error('Move API error:', errorData);
        throw new Error(errorData.error || 'Failed to move file');
      }
      
      // Refresh the file list after successful move
      if (refreshFiles) refreshFiles();
      
    } catch (error) {
      console.error('Move error:', error);
      setError(typeof error === 'string' ? error : 'Failed to move file');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDuplicate = async () => {
    setMenuOpen(false);
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // First, get the file content
      const downloadResponse = await fetch(`/api/files/download?fileId=${file.fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!downloadResponse.ok) throw new Error('Failed to get file content');
      
      const { url } = await downloadResponse.json();
      
      // Get the file content from the presigned URL
      const fileResponse = await fetch(url);
      const fileContent = await fileResponse.blob();
      
      // Get a unique name for the duplicate
      const nameWithoutExt = file.fileName.includes('.') ? 
        file.fileName.substring(0, file.fileName.lastIndexOf('.')) : file.fileName;
      const extension = file.fileName.includes('.') ? 
        file.fileName.substring(file.fileName.lastIndexOf('.')) : '';
      const duplicateName = `${nameWithoutExt} (copy)${extension}`;
      
      // Create a new file from the content
      const formData = new FormData();
      formData.append('file', new File([fileContent], duplicateName, { type: file.mimeType }));
      
      if (file.parentFolderId) {
        formData.append('parentFolderId', file.parentFolderId);
      }
      
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) throw new Error('Failed to upload duplicate file');
      
      if (refreshFiles) refreshFiles();
      
    } catch (error) {
      console.error('Duplicate error:', error);
      setError('Failed to duplicate file');
    } finally {
      setLoading(false);
    }
  };
  
  if (viewMode === 'grid') {
    return (
      <>
        <div 
          onClick={handlePreview}
          className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >
          <div className="p-2 sm:p-3 relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="loading-spinner"></div>
              </div>
            )}
            
            <div className="flex justify-between w-full">
              <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FontAwesomeIcon icon={getFileIcon()} style={{ width: '1rem', height: '1rem' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={file.fileName}>
                    {file.fileName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center">
                    <span className="inline-block">{formatFileSize(file.size)}</span>
                    <span className="mx-1 inline-block">•</span>
                    <span className="inline-block">{formatDate(file.createdAt)}</span>
                    {file.sharedWith && file.sharedWith.length > 0 && (
                      <>
                        <span className="mx-1 inline-block">•</span>
                        <span className="inline-block">Shared with {file.sharedWith.length}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="relative flex-shrink-0 ml-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Get the position of the button for menu placement
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom,
                      left: rect.left,
                      right: window.innerWidth - rect.right
                    });
                    setMenuOpen(!menuOpen);
                  }}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  style={{ minWidth: '32px', minHeight: '32px' }}
                >
                  <FontAwesomeIcon icon={faEllipsisV} className="h-4 w-4" />
                </button>
                
                {menuOpen && (
                  <div 
                    ref={menuRef}
                    className="fixed rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    style={{
                      top: menuPosition.top + 'px',
                      left: menuPosition.left - 150 + 'px', // Offset to center menu
                      width: '200px',
                      maxHeight: '90vh',
                      overflowY: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={handlePreview}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-3 h-4 w-4" />
                        Preview
                      </button>
                      <button
                        onClick={handleDownload}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-3 h-4 w-4" />
                        Download
                      </button>
                      
                      {isOwner && (
                        <>
                          <button
                            onClick={handleShare}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faShare} className="mr-3 h-4 w-4" />
                            Share
                          </button>
                          <button
                            onClick={handleRename}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faPen} className="mr-3 h-4 w-4" />
                            Rename
                          </button>
                          <button
                            onClick={handleMoveToFolder}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faFolderPlus} className="mr-3 h-4 w-4" />
                            Move to folder
                          </button>
                          <button
                            onClick={handleDuplicate}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faCopy} className="mr-3 h-4 w-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={handleDelete}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-3 h-4 w-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mt-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* No duplicate dropdown menu here */}
        
        {showShareModal && (
          <ShareModal
            file={file}
            onClose={() => setShowShareModal(false)}
            onShare={refreshFiles}
          />
        )}
        
        {showPreview && (
          <FilePreview
            file={file}
            onClose={() => setShowPreview(false)}
          />
        )}
        
        {showMoveModal && (
          <MoveFileModal
            file={file}
            onClose={() => setShowMoveModal(false)}
            onMove={handleMove}
          />
        )}
      </>
    );
  }
  
  // List view
  return (
    <>
      <div 
        onClick={handlePreview}
        className="border-b border-gray-200 py-1.5 sm:py-2 px-2 sm:px-3 hover:bg-gray-50 relative w-full group cursor-pointer"
      >
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        <div className="flex items-center">
          {/* File icon */}
          <div className="w-10 flex justify-center">
            <FontAwesomeIcon icon={getFileIcon()} className="text-blue-500 h-5 w-5" />
          </div>
          
          {/* File name and info */}
          <div className="flex-1 min-w-0 px-2">
            <div className="flex items-center space-x-1">
              <h3 className="text-sm text-gray-800 truncate" title={file.fileName}>
                {file.fileName}
              </h3>
            </div>
            <div className="flex text-xs text-gray-500 mt-0.5">
              <span>{formatFileSize(file.size)}</span>
              <span className="mx-1">•</span>
              <span>{formatDate(file.createdAt)}</span>
              {file.sharedWith && file.sharedWith.length > 0 && (
                <>
                  <span className="mx-1">•</span>
                  <span>Shared with {file.sharedWith.length}</span>
                </>
              )}
            </div>
          </div>
          
          {/* More actions menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Get the position of the button for menu placement
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  top: rect.bottom,
                  left: rect.left,
                  right: window.innerWidth - rect.right
                });
                setMenuOpen(!menuOpen);
              }}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
              style={{ minWidth: '32px', minHeight: '32px' }}
            >
              <FontAwesomeIcon icon={faEllipsisV} className="h-4 w-4" />
            </button>
            
            {menuOpen && (
              <div 
                ref={menuRef}
                className="fixed rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                style={{
                  top: menuPosition.top + 'px',
                  left: menuPosition.left - 150 + 'px', // Offset to center menu
                  width: '200px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button
                    onClick={handlePreview}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-3 h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-3 h-4 w-4" />
                    Download
                  </button>
                  
                  {isOwner && (
                    <>
                      <button
                        onClick={handleShare}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faShare} className="mr-3 h-4 w-4" />
                        Share
                      </button>
                      <button
                        onClick={handleRename}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faPen} className="mr-3 h-4 w-4" />
                        Rename
                      </button>
                      <button
                        onClick={handleMoveToFolder}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faFolderPlus} className="mr-3 h-4 w-4" />
                        Move to folder
                      </button>
                      <button
                        onClick={handleDuplicate}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faCopy} className="mr-3 h-4 w-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-3 h-4 w-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-1 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
      
      {/* No duplicate dropdown menu here */}
      
      {showShareModal && (
        <ShareModal
          file={file}
          onClose={() => setShowShareModal(false)}
          onShare={refreshFiles}
        />
      )}
      
      {showPreview && (
        <FilePreview
          file={file}
          onClose={() => setShowPreview(false)}
        />
      )}
      
      {showMoveModal && (
        <MoveFileModal
          file={file}
          onClose={() => setShowMoveModal(false)}
          onMove={handleMove}
        />
      )}
    </>
  );
}
