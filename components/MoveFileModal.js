import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFolderOpen, faArrowLeft, faHome } from '@fortawesome/free-solid-svg-icons';

export default function MoveFileModal({ file, onClose, onMove }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folders, setFolders] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [folderPath, setFolderPath] = useState([{ id: null, name: 'My Drive' }]);
  
  useEffect(() => {
    fetchFolders(null); // Start with root folders
  }, []);

  const fetchFolders = async (folderId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      let url = '/api/files/list';
      if (folderId) {
        url += `?parentFolderId=${folderId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      
      const data = await response.json();
      console.log('Fetched files/folders:', data);
      
      // Filter out only folders
      let foldersList = [];
      if (data.ownedFiles) {
        foldersList = data.ownedFiles.filter(item => item.isFolder === true);
      }
      
      console.log('Filtered folders:', foldersList);
      setFolders(foldersList);
      
      // Keep the current folder ID in state for the move operation
      if (folderId !== undefined) {
        setCurrentLocation(folderId);
      }
      
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder) => {
    if (folder.isFolder) {
      // Update current selected location
      setCurrentLocation(folder.fileId);
      
      // Update breadcrumb path
      const newPath = [...folderPath];
      const existingIndex = newPath.findIndex(item => item.id === folder.fileId);
      
      if (existingIndex >= 0) {
        // If we're navigating back to a folder in the path, truncate the path
        setFolderPath(newPath.slice(0, existingIndex + 1));
      } else {
        // Add this folder to the path
        newPath.push({ id: folder.fileId, name: folder.fileName });
        setFolderPath(newPath);
      }
      
      fetchFolders(folder.fileId);
    }
  };

  const navigateUp = () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const parentFolderId = newPath[newPath.length - 1].id;
      setCurrentLocation(parentFolderId);
      fetchFolders(parentFolderId);
    }
  };

  const navigateToRoot = () => {
    setFolderPath([{ id: null, name: 'My Drive' }]);
    setCurrentLocation(null); // Root folder has null ID
    fetchFolders(null);
  };

  const handleMove = () => {
    const destinationFolderId = currentLocation;
    console.log('Moving file to folder:', destinationFolderId);
    
    // Only call onMove if we have a valid destination (can be null for root folder)
    if (destinationFolderId !== undefined) {
      onMove(destinationFolderId);
    } else {
      console.error('Invalid destination folder selected');
      setError('Please select a valid destination folder');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 sm:mx-auto max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Move {file.fileName}</h2>
        </div>
        
        <div className="p-3 border-b flex items-center text-sm">
          <span className="font-medium mr-2">Current location:</span>
          <span className="bg-gray-100 rounded-md py-1 px-2 flex items-center">
            <FontAwesomeIcon icon={faFolder} className="mr-2 text-gray-500" style={{ width: '0.875rem', height: '0.875rem' }} />
            {folderPath[folderPath.length - 1].name}
          </span>
        </div>
        
        <div className="border-b p-2 flex items-center">
          <button 
            onClick={navigateUp} 
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            disabled={folderPath.length <= 1}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ width: '0.875rem', height: '0.875rem' }} />
          </button>
          <button 
            onClick={navigateToRoot}
            className="p-2 rounded-full hover:bg-gray-100 mx-1"
          >
            <FontAwesomeIcon icon={faHome} style={{ width: '0.875rem', height: '0.875rem' }} />
          </button>
          <div className="flex-1 overflow-x-auto whitespace-nowrap px-2">
            {folderPath.map((folder, index) => (
              <span key={index} className="inline-flex items-center">
                {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                <button 
                  onClick={() => {
                    setCurrentLocation(folder.id);
                    // Truncate path to this folder
                    setFolderPath(folderPath.slice(0, index + 1));
                    fetchFolders(folder.id);
                  }}
                  className="hover:underline text-blue-600"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : folders.length === 0 ? (
            <div className="p-4">
              <div className="text-gray-500 p-4 text-center mb-4">No folders found</div>
              <div className="text-sm text-gray-600 border-t pt-4 text-center">
                <p>You need to create folders first.</p>
                <p className="mt-2">You can create a folder from the dashboard using the "Create Folder" button.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map(folder => (
                <div 
                  key={folder.fileId}
                  onClick={() => navigateToFolder(folder)}
                  className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-100 ${folder.fileId === currentLocation ? 'bg-blue-50' : ''}`}
                >
                  <FontAwesomeIcon 
                    icon={folder.fileId === currentLocation ? faFolderOpen : faFolder} 
                    className={`mr-2 ${folder.fileId === currentLocation ? 'text-blue-500' : 'text-yellow-500'}`}
                    style={{ width: '1rem', height: '1rem' }} 
                  />
                  <span className="truncate">{folder.fileName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-2 text-red-500 text-sm text-center">{error}</div>
        )}
        
        <div className="border-t p-3 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
