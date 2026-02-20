import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.pathname);

  const navItems = [
    { key: 'stock', label: '📦 Gestion Stock', path: '/dashboard' },
    { key: 'menu', label: '🍽️ Menu', path: '/menu-management' },
    { key: 'matieres', label: '🧪 Matières Premières', path: '/matieres-premieres' },
    { key: 'bilan', label: '📅 BILAN MENSUEL', path: '/bilan-mensuelle' },
    { key: 'ventes', label: '💰 GESTION VENTES', path: '/gestion-ventes' }
  ];

  const handleNavigation = (path: string) => {
    setActiveTab(path);
    router.push(path);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #03224c 0%, #0f3460 100%)',
      padding: '1rem 2rem',
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(3, 34, 76, 0.3)',
      position: 'sticky',
      top: '0',
      zIndex: 1000
    }}>
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => handleNavigation(item.path)}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === item.path
              ? 'rgba(255, 182, 193, 0.2)'
              : 'rgba(255, 255, 255, 0.1)',
            color: activeTab === item.path ? '#FFB6C1' : 'white',
            border: activeTab === item.path
              ? '2px solid #FFB6C1'
              : '2px solid transparent',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
