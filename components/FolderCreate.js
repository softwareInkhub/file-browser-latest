import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';

export default function FolderCreate({ onFolderCreated, currentFolderId = null }) {
  const [showForm, setShowForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }
    
    setIsCreating(true);
    
    try {
      console.log('Creating folder with name:', folderName.trim(), 'and parentFolderId:', currentFolderId || 'null');
      const response = await fetch('/api/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token for authentication
        },
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentFolderId: currentFolderId || null
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }
      
      const folder = await response.json();
      
      // Reset form and notify parent
      setFolderName('');
      setShowForm(false);
      if (onFolderCreated) onFolderCreated(folder);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(error.message || 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FontAwesomeIcon icon={faFolderPlus} className="mr-1.5 h-3.5 w-3.5" />
          Create New Folder
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="border border-gray-200 bg-white p-2 sm:p-3 rounded-md shadow-sm mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Folder</h3>
          <div className="mb-2">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFolderName('');
                setError('');
              }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
