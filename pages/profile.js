import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AuthGuard from '../components/AuthGuard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faEdit,
  faKey,
  faCheckCircle,
  faExclamationCircle,
  faShield
} from '@fortawesome/free-solid-svg-icons';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Parse the token to get user info (simple approach for demo)
        // In real app, you would fetch this from an API endpoint
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        setUser({
          userId: tokenData.userId,
          email: tokenData.email,
          name: tokenData.name || 'User', // Default name if not in token
        });

        setFormData({
          name: tokenData.name || 'User',
          email: tokenData.email,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setUpdateError(null);

    try {
      // Here you would normally send an API request to update the profile
      // For this demo, we'll just update the local state
      setUser({
        ...user,
        name: formData.name,
        email: formData.email,
      });

      setEditMode(false);
      setUpdateSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setUpdateError('Failed to update profile information');
    }
  };

  return (
    <Layout title="Profile - Secure File Storage">
      <AuthGuard>
        <div className="max-w-4xl mx-auto p-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Your Profile</h1>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your profile...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 h-5 w-5 mr-3 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4 flex-shrink-0">
                      <FontAwesomeIcon icon={faUser} className="h-8 w-8" />
                    </div>
                    <div className="overflow-hidden">
                      <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
                      <p className="text-gray-500 flex items-center overflow-hidden">
                        <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{user?.email}</span>
                      </p>
                    </div>
                  </div>
                  
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 self-start sm:self-center mt-2 sm:mt-0"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {updateSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}
                
                {updateError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                    <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <span>{updateError}</span>
                  </div>
                )}
                
                {editMode ? (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: user?.name || '',
                              email: user?.email || '',
                            });
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="border-t border-b border-gray-200 py-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">User ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 break-all">{user?.userId}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900 break-words">{user?.email}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">Standard</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Storage Usage</dt>
                          <dd className="mt-1 text-sm text-gray-900">0.12 GB / 5 GB</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div className="border-b border-gray-200 py-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faKey} className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">Password</p>
                            <p className="text-sm text-gray-500">Last changed never</p>
                          </div>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-500 font-medium self-end sm:self-center">
                          Change
                        </button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-4">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faShield} className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">Two-factor authentication</p>
                            <p className="text-sm text-gray-500">Not enabled</p>
                          </div>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-500 font-medium self-end sm:self-center">
                          Enable
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AuthGuard>
    </Layout>
  );
}
