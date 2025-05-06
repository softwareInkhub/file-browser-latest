import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        
        if (!token || !user) {
          console.log('No token or user found in localStorage, redirecting to login');
          router.push('/login');
          return;
        }
        
        // Skip server validation for now to avoid circular dependency
        console.log('Token found in localStorage');
        setLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading-spinner"></div>
        <span className="ml-2">Authenticating...</span>
      </div>
    );
  }
  
  return <>{children}</>;
}
