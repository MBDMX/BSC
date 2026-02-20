import "../styles/globals.css";
import type { AppProps } from "next/app";
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Pages that don't need the persistent layout/protection
  const noLayoutPages = ['/login', '/'];
  const isNoLayout = noLayoutPages.includes(router.pathname);

  return (
    <ChakraProvider>
      {isNoLayout ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ProtectedRoute>
      )}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
      />
    </ChakraProvider>
  );
}