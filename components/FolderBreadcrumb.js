import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function FolderBreadcrumb({ currentFolder, folderPath = [], onNavigate }) {
  const [path, setPath] = useState([]);
  
  // Update path whenever currentFolder or folderPath changes
  useEffect(() => {
    // If folderPath is provided, use it directly
    if (folderPath && folderPath.length > 0) {
      setPath(folderPath);
      return;
    }
    
    // Otherwise, if currentFolder is provided, update the path
    if (currentFolder) {
      setPath(prevPath => {
        // Check if this folder is already in the path
        const existingIndex = prevPath.findIndex(f => f.fileId === currentFolder.fileId);
        
        if (existingIndex >= 0) {
          // If it exists, truncate the path up to this folder
          return prevPath.slice(0, existingIndex + 1);
        } else {
          // Otherwise, add it to the path
          return [...prevPath, currentFolder];
        }
      });
    } else {
      // If no folder is selected, reset to home
      setPath([]);
    }
  }, [currentFolder, folderPath]);
  
  const handleNavigate = (folder, index) => {
    if (onNavigate) {
      // Update the path to include only items up to this index
      const newPath = index >= 0 ? path.slice(0, index + 1) : [];
      onNavigate(folder, newPath);
    }
  };
  
  return (
    <div className="flex items-center text-sm text-gray-500 px-2 sm:px-4 py-2 overflow-x-auto">
    
      
      {path.map((folder, index) => (
        <div key={folder.fileId} className="flex items-center">
          <FontAwesomeIcon icon={faChevronRight} className="mx-1 text-gray-400 text-xs" />
          <button 
            onClick={() => handleNavigate(folder, index)}
            className={`hover:text-blue-600 hover:bg-gray-100 py-1 px-2 rounded-md transition-colors ${index === path.length - 1 ? 'font-medium text-blue-600' : ''}`}>
            {folder.fileName}
          </button>
        </div>
      ))}
    </div>
  );
}
