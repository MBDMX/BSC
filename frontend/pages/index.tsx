import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté de manière synchrone
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      // Utilisateur non connecté, rediriger vers login
      router.replace("/login");
    }
  }, [router]);

  // Afficher un loader simple pendant la redirection
  return React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f5f5f5'
    }
  }, React.createElement('div', {
    style: {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #4a148c',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }
  }));
}