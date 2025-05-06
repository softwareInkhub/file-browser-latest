import { useState, useEffect, useCallback } from 'react';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import FolderBreadcrumb from './FolderBreadcrumb';
import FolderCreate from './FolderCreate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faThLarge, faSearch, faExclamationTriangle, faFile, faFolder } from '@fortawesome/free-solid-svg-icons';

export default function FileList({ files, refreshFiles, isSharedView = false, isOwner = true, parentFolderId = null }) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [selectedTab] = useState('owned'); // Always using owned files now
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Define the fetch folder contents function
  const fetchFolderContents = async (folderId = null) => {
    setLoading(true);
    try {
      const query = folderId ? `?parentFolderId=${folderId}` : '';
      const response = await fetch(`/api/files/list${query}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch folder contents');
      }
      
      const data = await response.json();
      if (refreshFiles) refreshFiles(data);
    } catch (error) {
      console.error('Error fetching folder contents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load folder contents when the component mounts
  useEffect(() => {
    // Only fetch if refreshFiles function is provided
    // This means we're in control of the file fetching
    if (refreshFiles) {
      fetchFolderContents(null);
    }
  }, []);  // Empty dependency array ensures it only runs once on mount
  
  // Handle folder creation
  const handleFolderCreated = async (folder) => {
    // Refresh the file list to include the new folder
    await fetchFolderContents(currentFolder?.fileId || null);
  };
  
  // Handle folder navigation
  const handleFolderNavigate = async (folder, newPath) => {
    setCurrentFolder(folder);
    if (newPath) setFolderPath(newPath);
    await fetchFolderContents(folder?.fileId || null);
  };
  
  // Handle folder deletion
  const handleFolderDelete = async (folder) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.fileName}"? This cannot be undone.`)) {
      try {
        const response = await fetch(`/api/folders/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ folderId: folder.fileId }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete folder');
        }
        
        // Refresh the file list after deletion
        await fetchFolderContents(currentFolder?.fileId || null);
      } catch (error) {
        console.error('Error deleting folder:', error);
        alert(`Failed to delete folder: ${error.message}`);
      }
    }
  };
  
  useEffect(() => {
    if (!files) return;
    
    console.log('FileList received files:', files);
    
    // Check if files is an array (flat structure) or has ownedFiles/sharedFiles properties
    let ownedItems = [];
    let sharedItems = [];
    
    if (Array.isArray(files)) {
      // If it's a flat array, assume all files are owned
      ownedItems = files;
      console.log('Files is an array with length:', files.length);
    } else if (files.ownedFiles || files.sharedFiles) {
      // If it has the expected structure
      ownedItems = Array.isArray(files.ownedFiles) ? files.ownedFiles : [];
      sharedItems = Array.isArray(files.sharedFiles) ? files.sharedFiles : [];
      
      // Special case: if ownedFiles is present but not an array (possibly an object with a file as first property)
      if (files.ownedFiles && !Array.isArray(files.ownedFiles) && typeof files.ownedFiles === 'object') {
        ownedItems = Object.values(files.ownedFiles).filter(item => 
          item && typeof item === 'object' && item.fileId && item.fileName
        );
      }
      
      console.log('Files has ownedFiles/sharedFiles structure:', {
        ownedFilesIsArray: Array.isArray(files.ownedFiles),
        processedOwnedFiles: ownedItems.length,
        sharedFilesIsArray: Array.isArray(files.sharedFiles),
        processedSharedFiles: sharedItems.length
      });
    } else {
      // If files is an object but doesn't have the expected properties,
      // convert it to an array and assume all files are owned
      ownedItems = Object.values(files).filter(item => 
        item && typeof item === 'object' && item.fileId && item.fileName
      );
      console.log('Files is an object, converted to array with length:', ownedItems.length);
    }
    
    // Choose items based on view mode (shared or owned)
    const items = isSharedView ? sharedItems : ownedItems;
    
    // Filter by search term and parentFolderId, and separate files from folders
    const filteredItems = items.filter(item => 
      // Only show items in the current folder
      (parentFolderId ? item.parentFolderId === parentFolderId : !item.parentFolderId) &&
      item.fileName &&
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Separate folders from files
    const folders = filteredItems.filter(item => item.isFolder === true);
    const fileItems = filteredItems.filter(item => item.isFolder !== true);
    
    console.log('Filtered items:', {
      totalCount: filteredItems.length,
      foldersCount: folders.length,
      filesCount: fileItems.length,
      folderSample: folders.length > 0 ? folders[0] : 'None',
      fileSample: fileItems.length > 0 ? fileItems[0] : 'None'
    });
    
    setFilteredFolders(folders);
    setFilteredFiles(fileItems);
  }, [files, searchTerm, parentFolderId]);
  
  if (!files) {
    return (
      <div className="text-center py-10">
        <div className="loading-spinner mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading files...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-0 sm:p-4">
      {/* Folder navigation breadcrumb */}
      <FolderBreadcrumb 
        currentFolder={currentFolder} 
        folderPath={folderPath} 
        onNavigate={handleFolderNavigate}
      />

      {/* Create folder button - only show in regular (owned) view and only at root */}
      {!isSharedView && !parentFolderId && (
        <div className="mb-4 px-2 sm:px-0">
          <FolderCreate 
            onFolderCreated={handleFolderCreated}
            currentFolderId={null}
          />
        </div>
      )}

      <div className="mb-2 px-2 sm:px-0 sm:mb-3">
        <div className="flex flex-wrap justify-between items-center mb-3 border-b border-gray-200 pb-2 sm:pb-3">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">Files</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <FontAwesomeIcon icon={faList} className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <FontAwesomeIcon icon={faThLarge} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 && filteredFolders.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          {searchTerm ? (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-100">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400 w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No matches found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No items match your search term "{searchTerm}". Try different keywords or clear your search.
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {isSharedView ? 'No files shared with you yet' : 'No files uploaded yet'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {isSharedView 
                  ? 'When someone shares a file with you, it will appear here.'
                  : 'Get started by uploading your first file or creating a folder. Your files are stored securely and can be shared with others.'}
              </p>
              {!isSharedView && (
                <div className="flex flex-col sm:flex-row justify-center gap-2 mt-2">
                  <button 
                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FontAwesomeIcon icon={faFile} className="mr-2 h-4 w-4" />
                    Upload a file
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Folders section */}
          {filteredFolders.length > 0 && (
            <div className="mb-6 px-2 sm:px-0">
              <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-3 flex items-center">
                <FontAwesomeIcon 
                  icon={faFolder} 
                  className="text-blue-500 mr-2" 
                  style={{ width: '0.9rem', height: '0.9rem' }}
                />
                Folders
              </h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredFolders.map((folder) => (
                  <FolderItem 
                    key={folder.fileId} 
                    folder={folder} 
                    onNavigate={handleFolderNavigate}
                    onDelete={handleFolderDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files section */}
          {filteredFiles.length > 0 && (
            <div className="px-2 sm:px-0">
              <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-3 flex items-center">
                <FontAwesomeIcon 
                  icon={faFile} 
                  className="text-gray-500 mr-2" 
                  style={{ width: '0.9rem', height: '0.9rem' }}
                />
                Files
              </h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredFiles.map((file) => (
                  <FileItem 
                    key={file.fileId} 
                    file={file} 
                    viewMode={viewMode} 
                    isOwner={isOwner}
                    refreshFiles={refreshFiles}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
