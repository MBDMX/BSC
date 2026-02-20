import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DirectAccess() {
  const router = useRouter();
  
  useEffect(() => {
    // Définir le token d'accès
    localStorage.setItem('access_token', 'demo_token');
    
    // Rediriger vers le tableau de bord
    router.push('/dashboard');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '20px',
        color: '#333',
      }}>
        Accès direct au tableau de bord...
      </div>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}></div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}