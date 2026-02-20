import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StockSynchronizer from '../components/StockSynchronizer';
import MenuManager from '../components/MenuManager';

export default function Menu() {
  const router = useRouter();

  return (
    <>
      {/* Composant invisible qui gère la synchronisation des données */}
      <StockSynchronizer />
      <Navbar />
      <div className="menu-page">
        <div className="menu-container">
          <div className="menu-header">
            <h1>🍔 Gestion du Menu</h1>
            <p>
              Gérez les produits de votre menu, leurs prix et leurs recettes.
            </p>
          </div>

          <MenuManager />
        </div>
      </div>
      <ToastContainer />
    </>
  );
}