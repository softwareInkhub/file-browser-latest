import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { adjustMainContentMargin } from '../lib/sidebarUtils';

export default function Layout({ children, title = 'Secure File Storage', showSidebar = true }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Add global loading indicator on route changes
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);
  
  // Apply margin adjustments when sidebar is collapsed/expanded
  useEffect(() => {
    if (showSidebar) {
      adjustMainContentMargin(sidebarCollapsed);
    }
  }, [sidebarCollapsed, showSidebar]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Secure File Storage System" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Navbar />
      
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-600 z-50 animate-pulse"></div>
      )}
      
      <main className="w-full">
        {showSidebar ? (
          <div className="flex flex-col md:flex-row min-h-screen">
            <div className="absolute md:static z-40">
              <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            </div>
            <div className="flex-1 w-full transition-all duration-300 p-2 sm:p-5 lg:p-6 max-w-full overflow-hidden md:ml-64" id="main-content">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      
      <footer className="bg-white shadow-inner py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Secure File Storage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
