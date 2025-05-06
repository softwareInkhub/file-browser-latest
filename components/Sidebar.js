import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { adjustMainContentMargin, getSavedSidebarState } from '../lib/sidebarUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUser,
  faFileAlt,
  faShareAlt,
  faCog,
  faSignOutAlt,
  faBars,
  faTimes,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(typeof window !== 'undefined' ? getSavedSidebarState() : false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when switching to desktop view
  useEffect(() => {
    if (windowWidth >= 768) { // md breakpoint
      setSidebarOpen(false);
    }
  }, [windowWidth]);
  
  // Apply main content margin adjustment when sidebar collapse state changes
  useEffect(() => {
    adjustMainContentMargin(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const isActive = (path) => router.pathname === path;

  const handleLogout = () => {
    // Clear auth token
    localStorage.removeItem('token');
    // Redirect to login page
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} className="h-6 w-6" />
        </button>
      </div>
      
      {/* Sidebar for mobile */}
      <div className={`md:hidden fixed inset-0 z-40 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
          <nav className="flex flex-col h-full py-6 px-4">
            <div className="mb-8 px-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-blue-600">Secure Files</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close sidebar"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-1">
              <SidebarLink 
                href="/dashboard" 
                icon={faHome} 
                text="Dashboard" 
                active={isActive('/dashboard')} 
                onClick={() => setSidebarOpen(false)}
                collapsed={false}
              />
              <SidebarLink 
                href="/profile" 
                icon={faUser} 
                text="Profile" 
                active={isActive('/profile')} 
                onClick={() => setSidebarOpen(false)}
                collapsed={false}
              />
              <SidebarLink 
                href="/my-files" 
                icon={faFileAlt} 
                text="My Files" 
                active={isActive('/my-files')} 
                onClick={() => setSidebarOpen(false)}
                collapsed={false}
              />
              <SidebarLink 
                href="/shared-files" 
                icon={faShareAlt} 
                text="Shared Files" 
                active={isActive('/shared-files')} 
                onClick={() => setSidebarOpen(false)}
                collapsed={false}
              />
              <SidebarLink 
                href="/settings" 
                icon={faCog} 
                text="Settings" 
                active={isActive('/settings')} 
                onClick={() => setSidebarOpen(false)}
                collapsed={false}
              />
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md w-full"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
      
      {/* Sidebar for desktop (collapsible) */}
      <div id="desktop-sidebar" className={`hidden md:block md:fixed md:inset-y-0 md:left-0 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-white shadow-lg transition-all duration-300 ease-in-out z-30`}>
        <nav className="flex flex-col h-full py-6 px-4 relative">
          {/* Collapse toggle button */}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md text-gray-500 hover:text-blue-600 focus:outline-none"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FontAwesomeIcon 
              icon={sidebarCollapsed ? faChevronRight : faChevronLeft} 
              className="h-4 w-4" 
            />
          </button>

          <div className={`${sidebarCollapsed ? 'justify-center' : 'px-4'} mb-8 flex`}>
            {sidebarCollapsed ? (
              <span className="text-2xl font-bold text-blue-600">SF</span>
            ) : (
              <h2 className="text-2xl font-bold text-blue-600">Secure Files</h2>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <SidebarLink 
              href="/dashboard" 
              icon={faHome} 
              text="Dashboard" 
              active={isActive('/dashboard')} 
              collapsed={sidebarCollapsed} 
            />
            <SidebarLink 
              href="/profile" 
              icon={faUser} 
              text="Profile" 
              active={isActive('/profile')} 
              collapsed={sidebarCollapsed} 
            />
            <SidebarLink 
              href="/my-files" 
              icon={faFileAlt} 
              text="My Files" 
              active={isActive('/my-files')} 
              collapsed={sidebarCollapsed} 
            />
            <SidebarLink 
              href="/shared-files" 
              icon={faShareAlt} 
              text="Shared Files" 
              active={isActive('/shared-files')} 
              collapsed={sidebarCollapsed} 
            />
            <SidebarLink 
              href="/settings" 
              icon={faCog} 
              text="Settings" 
              active={isActive('/settings')} 
              collapsed={sidebarCollapsed} 
            />
          </div>
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex ${sidebarCollapsed ? 'justify-center' : 'items-center'} px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md w-full`}
              title="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className={sidebarCollapsed ? '' : 'mr-3'} style={{ width: '1.25rem', height: '1.25rem' }} />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

function SidebarLink({ href, icon, text, active, onClick, collapsed }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`flex ${collapsed ? 'justify-center' : 'items-center'} px-4 py-2 ${active
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
      } rounded-md`}
      title={collapsed ? text : ''}
    >
      <FontAwesomeIcon icon={icon} className={collapsed ? '' : 'mr-3'} style={{ width: '1.25rem', height: '1.25rem' }} />
      {!collapsed && <span>{text}</span>}
    </Link>
  );
}
