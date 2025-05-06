import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import AuthGuard from '../components/AuthGuard';
// Sidebar is now included in Layout component
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faExclamationCircle, faBookmark, faEllipsisV, faLink, faExternalLinkAlt, faCopy, faClone, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSavedLinksModal, setShowSavedLinksModal] = useState(false);
  const [savedLinkInput, setSavedLinkInput] = useState('');
  const [savedLinks, setSavedLinks] = useState([]);
  const [savingLink, setSavingLink] = useState(false);
  const [linkNameInput, setLinkNameInput] = useState('');
  const [searchLinks, setSearchLinks] = useState('');
  const [editingLink, setEditingLink] = useState(null); // { id, name, url }
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [openLinkMenuId, setOpenLinkMenuId] = useState(null);
  const [linkMenuPosition, setLinkMenuPosition] = useState({ top: 0, left: 0 });
  const menuRefs = useRef({});

  // Auth check effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        setCheckingAuth(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 0);
      } else {
        setCheckingAuth(false);
      }
    }
  }, []);

  // Fetch files only after auth check passes
  useEffect(() => {
    if (!checkingAuth && typeof window !== 'undefined' && localStorage.getItem('token')) {
      fetchFiles();
    }
    // eslint-disable-next-line
  }, [checkingAuth]);

  // Fetch saved links from backend on load
  useEffect(() => {
    if (!checkingAuth) {
      fetchSavedLinks();
    }
    // eslint-disable-next-line
  }, [checkingAuth]);

  // Close link menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (openLinkMenuId && menuRefs.current[openLinkMenuId] && !menuRefs.current[openLinkMenuId].contains(event.target)) {
        setOpenLinkMenuId(null);
      }
    }
    if (openLinkMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openLinkMenuId]);

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
        return;
      }
      const response = await fetch('/api/files/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
          return;
        }
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load your files. Please try again or login again.');
      setFiles({ ownedFiles: [], sharedFiles: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/links', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedLinks(data.links || []);
      } else {
        setSavedLinks([]);
      }
    } catch (e) {
      setSavedLinks([]);
    }
  };

  // Add debugging to show what files are being received
  useEffect(() => {
    if (files) {
      console.log('Files received in dashboard:', {
        hasOwnedFiles: files && files.ownedFiles,
        ownedFilesCount: files && files.ownedFiles ? files.ownedFiles.length : 0,
        hasSharedFiles: files && files.sharedFiles,
        sharedFilesCount: files && files.sharedFiles ? files.sharedFiles.length : 0
      });
      if (files.ownedFiles && files.ownedFiles.length > 0) {
        console.log('Sample file structure:', files.ownedFiles[0]);
      }
    }
  }, [files]);

  const handleFileUploaded = () => {
    fetchFiles();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Delete link
  const handleDeleteLink = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/links?id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchSavedLinks();
  };

  // Edit link
  const handleEditLink = (link) => {
    setEditingLink(link);
    setEditName(link.name);
    setEditUrl(link.url);
  };

  const handleSaveEdit = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/links', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: editingLink.id, name: editName, url: editUrl })
    });
    setEditingLink(null);
    setEditName('');
    setEditUrl('');
    await fetchSavedLinks();
  };

  if (checkingAuth) {
    return null; // Or a loading spinner
  }

  return (
    <Layout title="Dashboard - Secure File Storage">
      <AuthGuard>
        <div className="flex flex-col space-y-2 sm:space-y-6 mx-0 px-2">
          <div className="bg-blue-600 text-white rounded-none shadow-none sm:rounded-lg sm:shadow-sm p-3 sm:p-5 overflow-hidden mx-0 w-full max-w-none">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-3 md:mb-0 text-center md:text-left">
                <h1 className="text-xl font-bold">Your Secure File Storage</h1>
                <p className="text-blue-100 text-sm mt-1">
                  Upload, manage, and share your files securely
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 text-sm text-blue-100">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span>Secure Storage</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>End-to-End Encryption</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-2 w-full mb-4 mt-4">
            <FileUpload onFileUploaded={handleFileUploaded} />
            <input
              type="text"
              placeholder="Search files..."
              className="border border-gray-300 rounded px-2 py-1 text-sm h-9 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 h-5 w-5 mr-3 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
          <FileList 
            files={files} 
            refreshFiles={fetchFiles} 
            searchTerm={searchTerm}
          />
          {/* Show saved links above the file list */}
          <div className="mb-4 w-full">
            <div className="bg-white rounded-none shadow-none sm:rounded-lg sm:shadow p-4 w-full max-w-none">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-lg font-semibold">Saved Links</h3>
                <div className="flex justify-between sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    className=" w-56 border border-gray-300 rounded px-2 py-1 text-sm h-9  sm:w-52 sm:text-base sm:h-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search links..."
                    value={searchLinks}
                    onChange={e => setSearchLinks(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-2 py-1 text-sm h-9 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-4 sm:py-1.5 sm:text-base sm:h-10"
                    onClick={() => setShowSavedLinksModal(true)}
                  >
                    <FontAwesomeIcon icon={faBookmark} className="h-4 w-3" />
                    Save Link
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedLinks.filter(link =>
                  link.name.toLowerCase().includes(searchLinks.toLowerCase()) ||
                  link.url.toLowerCase().includes(searchLinks.toLowerCase())
                ).map((link) => (
                  <div key={link.id} className="bg-white border rounded-none shadow-none sm:rounded-lg sm:shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex items-center group cursor-pointer relative w-full max-w-none">
                    <div className="flex items-center space-x-3 min-w-0 overflow-hidden flex-1 p-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FontAwesomeIcon icon={faLink} style={{ width: '1rem', height: '1rem' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={link.name}>{link.name}</h3>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all" title={link.url}>
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0 ml-2 pr-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setLinkMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
                          setOpenLinkMenuId(openLinkMenuId === link.id ? null : link.id);
                        }}
                        className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
                        style={{ minWidth: '32px', minHeight: '32px' }}
                        title="Actions"
                      >
                        <FontAwesomeIcon icon={faEllipsisV} className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Render the menu as a fixed element outside the card */}
                {openLinkMenuId && (
                  <div
                    className="absolute z-50 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    style={{ top: linkMenuPosition.top, left: linkMenuPosition.left }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          const link = savedLinks.find(l => l.id === openLinkMenuId);
                          window.open(link.url, '_blank');
                          setOpenLinkMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2 h-4 w-4" />
                        Redirect
                      </button>
                      <button
                        onClick={() => {
                          const link = savedLinks.find(l => l.id === openLinkMenuId);
                          navigator.clipboard.writeText(link.url);
                          setOpenLinkMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faCopy} className="mr-2 h-4 w-4" />
                        Copy
                      </button>
                      <button
                        onClick={async () => {
                          const link = savedLinks.find(l => l.id === openLinkMenuId);
                          setSavingLink(true);
                          try {
                            const token = localStorage.getItem('token');
                            await fetch('/api/links', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ name: link.name + ' (copy)', url: link.url })
                            });
                            await fetchSavedLinks();
                          } finally {
                            setSavingLink(false);
                            setOpenLinkMenuId(null);
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faClone} className="mr-2 h-4 w-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          const link = savedLinks.find(l => l.id === openLinkMenuId);
                          setEditingLink(link);
                          setEditName(link.name);
                          setEditUrl(link.url);
                          setOpenLinkMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faPen} className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteLink(openLinkMenuId);
                          setOpenLinkMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                {savedLinks.length === 0 && (
                  <div className="col-span-full py-3 text-gray-400 text-center">No saved links yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>

      {/* Saved Links Modal */}
      {showSavedLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
              onClick={() => setShowSavedLinksModal(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Save a Link</h2>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link name (e.g. Google Docs)"
              value={linkNameInput}
              onChange={e => setLinkNameInput(e.target.value)}
            />
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your link here..."
              value={savedLinkInput}
              onChange={e => setSavedLinkInput(e.target.value)}
            />
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              disabled={savingLink || !linkNameInput.trim() || !savedLinkInput.trim()}
              onClick={async () => {
                setSavingLink(true);
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch('/api/links', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: linkNameInput.trim(), url: savedLinkInput.trim() })
                  });
                  if (response.ok) {
                    await fetchSavedLinks();
                  }
                } finally {
                  setSavingLink(false);
                  setLinkNameInput('');
                  setSavedLinkInput('');
                  setShowSavedLinksModal(false);
                }
              }}
            >
              {savingLink ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
              onClick={() => setEditingLink(null)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit Link</h2>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link URL"
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
            />
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              onClick={handleSaveEdit}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
