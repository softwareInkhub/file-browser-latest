import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faTrash, faEllipsisV, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function FolderItem({ folder, onNavigate, onDelete }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleNavigate = (e) => {
    e.preventDefault();
    // Navigate to the folder page
    router.push(`/folder/${folder.fileId || folder.id}`);
    // Also call the onNavigate handler if provided (for backwards compatibility)
    if (onNavigate) onNavigate(folder);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(folder);
    setShowMenu(false);
  };

  // Format the folder creation date
  const formattedDate = new Date(folder.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div 
        onClick={handleNavigate}
        className="flex items-center p-1.5 sm:p-2 bg-white border border-gray-200 rounded-md mb-2 hover:bg-gray-50 cursor-pointer transition-colors relative group"
      >
        <div className="flex justify-between w-full">
          <div className="flex items-center min-w-0 overflow-hidden">
            <div className="flex-shrink-0 mr-3">
              <FontAwesomeIcon 
                icon={faFolder} 
                className="text-blue-500" 
                style={{ width: '1rem', height: '1rem' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate" title={folder.fileName}>{folder.fileName}</p>
              <p className="text-xs text-gray-500 truncate">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <FontAwesomeIcon icon={faEllipsisV} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Dropdown Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowMenu(false)}>
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
               style={{
                 top: window.event?.clientY || 100,
                 left: window.event?.clientX || window.innerWidth - 200,
               }}
               onClick={e => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={handleNavigate}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <FontAwesomeIcon icon={faFolderOpen} className="mr-3 h-4 w-4" />
                Open Folder
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-3 h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>  
  );
}
