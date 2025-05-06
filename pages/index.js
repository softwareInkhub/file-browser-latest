import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faLock, faShareAlt, faMobileAlt } from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);
  
  return (
    <Layout title="Secure File Storage - Home" showSidebar={false}>
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Secure Cloud Storage for Your Files
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Store, share, and access your files securely from anywhere, on any device.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/register" className="btn-primary text-center">
                  Get Started
                </Link>
                <Link href="/login" className="btn-secondary text-center">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6"
                alt="Cloud Storage"
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Secure File Storage
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <FontAwesomeIcon icon={faLock} className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bank-Level Security
              </h3>
              <p className="text-gray-600">
                Your files are encrypted and securely stored in AWS S3 with strict access controls.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <FontAwesomeIcon icon={faShareAlt} className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Easy File Sharing
              </h3>
              <p className="text-gray-600">
                Share files securely with other users while maintaining control over your data.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <FontAwesomeIcon icon={faMobileAlt} className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mobile Responsive
              </h3>
              <p className="text-gray-600">
                Access your files from any device with our responsive, mobile-friendly interface.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Image Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:order-2 md:pl-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Organize and Manage Your Files
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our intuitive interface makes it easy to upload, organize, and manage your files from anywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure file upload and storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Easy sharing with specific users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Responsive design for all devices</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1644363832001-0876e81f37a9"
                alt="File Management"
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our secure file storage system for their important documents.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register" className="bg-white text-blue-600 hover:bg-gray-100 py-3 px-8 rounded-lg font-semibold shadow-md transition duration-300">
              Create Free Account
            </Link>
            <Link href="/login" className="bg-blue-700 text-white hover:bg-blue-800 py-3 px-8 rounded-lg font-semibold shadow-md transition duration-300">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
