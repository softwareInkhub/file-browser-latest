import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faUserPlus, faCheck, faExclamationCircle, faLink, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faTelegram } from '@fortawesome/free-brands-svg-icons';

export default function ShareModal({ file, onClose, onShare }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  
  useEffect(() => {
    // Fetch details about users the file is shared with
    const fetchSharedUsers = async () => {
      if (!file.sharedWith || file.sharedWith.length === 0) {
        return;
      }
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/files/share?fileId=${file.fileId}&action=list`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch shared users');
        }
        
        const data = await response.json();
        setSharedUsers(data.sharedUsers || []);
      } catch (error) {
        console.error('Failed to fetch shared users:', error);
        setError('Failed to load shared users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedUsers();
  }, [file]);
  
  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: file.fileId,
          email,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share file');
      }
      
      const data = await response.json();
      setSuccess(true);
      setEmail('');
      
      // Update the list of shared users
      if (data.sharedUsers) {
        setSharedUsers(data.sharedUsers);
      }
      
      // Notify parent component
      if (onShare) {
        onShare();
      }
    } catch (error) {
      console.error('Share error:', error);
      setError(error.message || 'Failed to share file');
    } finally {
      setLoading(false);
    }
  };
  
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
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg max-w-md w-full mx-4 sm:mx-auto shadow-xl transform transition-all">
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
          </button>
        </div>
        
        <div className="px-4 pt-5 pb-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Share "{file.fileName}"
          </h3>
          
          <form onSubmit={handleShare}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Share with (email address)
              </label>
              <div className="flex">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 input-field"
                  placeholder="user@example.com"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2 h-4 w-4" />
                  )}
                  Share
                </button>
              </div>
            </div>
          </form>
          
          {/* Additional share options */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Other share options</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/shared/${file.fileId}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert('Link copied to clipboard!');
                }}
              >
                <FontAwesomeIcon icon={faLink} className="mr-2 h-4 w-4" />
                Copy Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}/shared/${file.fileId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="mr-2 h-4 w-4 text-green-500" />
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=Shared File&body=${encodeURIComponent(`${window.location.origin}/shared/${file.fileId}`)}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faEnvelope} className="mr-2 h-4 w-4 text-blue-500" />
            Email
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/shared/${file.fileId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faTelegram} className="mr-2 h-4 w-4 text-blue-400" />
              Telegram
              </a>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
              <FontAwesomeIcon icon={faCheck} className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
              <span>File shared successfully!</span>
            </div>
          )}
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Shared with</h4>
            
            {loading && !sharedUsers.length ? (
              <div className="flex justify-center py-4">
                <div className="loading-spinner"></div>
              </div>
            ) : sharedUsers.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                This file hasn't been shared with anyone yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                {sharedUsers.map((user) => (
                  <li key={user.userId} className="py-3 flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
