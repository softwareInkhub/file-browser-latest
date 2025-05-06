import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { config } from '@fortawesome/fontawesome-svg-core';

// Manually control FontAwesome CSS injection
config.autoAddCss = false;

function MyApp({ Component, pageProps }) {
  // Add a check to see if the browser is online
  useEffect(() => {
    const handleOffline = () => {
      alert('You are currently offline. Some features may not work correctly.');
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Secure File Storage</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
