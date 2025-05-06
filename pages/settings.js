import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AuthGuard from '../components/AuthGuard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faUser,
  faKey,
  faShield,
  faBell,
  faDownload,
  faTrash,
  faCheckCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const [success, setSuccess] = useState(null);
  
  // Form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    fileUpdates: false
  });
  
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

        // Parse the token to get user info
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        setUser({
          userId: tokenData.userId,
          email: tokenData.email,
          name: tokenData.name || 'User',
          createdAt: new Date().toLocaleDateString(), // Placeholder
          storageUsed: '0.12 GB',
          storageLimit: '5 GB'
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
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({ ...notificationSettings, [name]: checked });
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Here you would send the password change request to the server
    // For now, we'll just show a success message
    setSuccess('Password updated successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };
  
  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    // Here you would send the notification settings update to the server
    // For now, we'll just show a success message
    setSuccess('Notification settings updated!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };
  
  const handleExportData = () => {
    // Here you would implement data export functionality
    alert('Export functionality would be implemented here');
  };
  
  const handleDeleteAccount = () => {
    // Here you would implement account deletion with confirmation
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion would be implemented here');
    }
  };
  
  return (
    <Layout title="Settings - Secure File Storage">
      <AuthGuard>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-700 text-white">
              <h1 className="text-xl font-bold flex items-center">
                <FontAwesomeIcon icon={faCog} className="mr-3 h-5 w-5" />
                Settings
              </h1>
              <p className="text-gray-300 text-sm mt-1">
                Manage your account and preferences
              </p>
            </div>
            
            {loading ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="animate-pulse text-gray-500">Loading settings...</div>
              </div>
            ) : error ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 h-5 w-5 mr-3 mt-0.5" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row">
                {/* Settings navigation */}
                <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50">
                  <nav className="p-4 space-y-1">
                    <button
                      onClick={() => setActiveTab('account')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'account' ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <FontAwesomeIcon icon={faUser} className="mr-3 h-4 w-4" />
                      Account
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'security' ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <FontAwesomeIcon icon={faShield} className="mr-3 h-4 w-4" />
                      Security
                    </button>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'notifications' ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <FontAwesomeIcon icon={faBell} className="mr-3 h-4 w-4" />
                      Notifications
                    </button>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'data' ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <FontAwesomeIcon icon={faDownload} className="mr-3 h-4 w-4" />
                      Data & Privacy
                    </button>
                  </nav>
                </div>
                
                {/* Settings content */}
                <div className="flex-1 p-4 sm:p-6">
                  {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                      <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {/* Account Settings */}
                  {activeTab === 'account' && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">User ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 break-all">{user?.userId}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                          <dd className="mt-1 text-sm text-gray-900">{user?.createdAt}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Storage Usage</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '2.4%' }}></div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{user?.storageUsed} of {user?.storageLimit} used (2.4%)</p>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                  
                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
                      <form onSubmit={handlePasswordSubmit} className="space-y-6 mb-8">
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-base font-medium text-gray-900 mb-2">Change Password</h3>
                          <div className="mt-4 space-y-4">
                            <div>
                              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                              <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                              <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                              <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="submit"
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <FontAwesomeIcon icon={faKey} className="mr-2 h-4 w-4" />
                              Update Password
                            </button>
                          </div>
                        </div>
                      </form>
                      
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-base font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FontAwesomeIcon icon={faShield} className="mr-2 h-4 w-4" />
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Notification Settings */}
                  {activeTab === 'notifications' && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
                      <form onSubmit={handleNotificationSubmit} className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="emailNotifications"
                                name="emailNotifications"
                                type="checkbox"
                                checked={notificationSettings.emailNotifications}
                                onChange={handleNotificationChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="emailNotifications" className="font-medium text-gray-700">Email Notifications</label>
                              <p className="text-gray-500">Receive email notifications about your account activity.</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="securityAlerts"
                                name="securityAlerts"
                                type="checkbox"
                                checked={notificationSettings.securityAlerts}
                                onChange={handleNotificationChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="securityAlerts" className="font-medium text-gray-700">Security Alerts</label>
                              <p className="text-gray-500">Get notified about important security events like login attempts.</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="fileUpdates"
                                name="fileUpdates"
                                type="checkbox"
                                checked={notificationSettings.fileUpdates}
                                onChange={handleNotificationChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="fileUpdates" className="font-medium text-gray-700">File Updates</label>
                              <p className="text-gray-500">Receive notifications when shared files are updated.</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <FontAwesomeIcon icon={faBell} className="mr-2 h-4 w-4" />
                            Save Preferences
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Data & Privacy Settings */}
                  {activeTab === 'data' && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Data & Privacy</h2>
                      
                      <div className="border-b border-gray-200 pb-6 mb-6">
                        <h3 className="text-base font-medium text-gray-900 mb-2">Export Your Data</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Download a copy of your personal data, including your files and account information.
                        </p>
                        <button
                          type="button"
                          onClick={handleExportData}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2 h-4 w-4" />
                          Export Data
                        </button>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium text-red-600 mb-2">Delete Account</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
