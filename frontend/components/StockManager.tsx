import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PDFExporter } from './PDFExporter';
import { toast } from 'react-toastify';

interface Product {
  id: number;
  nom: string;
  quantite: number;
  seuil: number;
  cout_unitaire: number;
  fournisseur: string;
  date_peremption?: string;
}

const StockManagerComponent = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockYesterday, setStockYesterday] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le rafraîchissement
  const [productStocks, setProductStocks] = useState<any[]>([]); // État pour productStocks
  const [newProduct, setNewProduct] = useState({
    nom: '',
    quantite: 0,
    seuil: 0,
    cout_unitaire: 0,
    fournisseur: '',
    date_peremption: '',
    unite: 'unité'
  });

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    const savedProducts = localStorage.getItem('productStocks');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProductStocks(parsedProducts);
        setIsLoaded(true);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
        setIsLoaded(true);
      }
    } else {
      // Données par défaut si rien n'est sauvegardé
      const defaultProducts = [
        {
          id: 1,
          nom: 'Pain Burger',
          quantite: 50,
          quantite_seuil: 10,
          prix: 0.50,
          unite: 'pièces'
        },
        {
          id: 2,
          nom: 'Steak Haché',
          quantite: 25,
          quantite_seuil: 5,
          prix: 3.20,
          unite: 'kg'
        }
      ];
      setProductStocks(defaultProducts);
      localStorage.setItem('productStocks', JSON.stringify(defaultProducts));
      setIsLoaded(true);
    }
  }, []);

  // Charger le stock d'hier
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `stock_${yesterday.toISOString().split('T')[0]}`;

    const savedYesterdayStock = localStorage.getItem(yesterdayKey);
    if (savedYesterdayStock) {
      try {
        setStockYesterday(JSON.parse(savedYesterdayStock));
      } catch (error) {
        console.error('Erreur chargement stock d\'hier:', error);
      }
    } else {
      // Créer des données factices pour la veille si elles n'existent pas
      const yesterdayStock = productStocks.map(p => ({
        ...p,
        quantite: p.quantite + Math.floor(Math.random() * 10) - 5 // Variation aléatoire
      }));
      setStockYesterday(yesterdayStock);
      localStorage.setItem(yesterdayKey, JSON.stringify(yesterdayStock));
    }
  }, [productStocks, refreshKey]);

  // Écouter les événements de mise à jour pour rafraîchir automatiquement
  useEffect(() => {
    const handleStockUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    const handleProductAdded = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('productStocks:updated', handleStockUpdate);
    window.addEventListener('product:added', handleProductAdded);
    window.addEventListener('storage', handleStockUpdate);

    return () => {
      window.removeEventListener('productStocks:updated', handleStockUpdate);
      window.removeEventListener('product:added', handleProductAdded);
      window.removeEventListener('storage', handleStockUpdate);
    };
  }, []);

  // Convertir les données du hook vers le format attendu par cette page
  const derivedProducts: Product[] = productStocks.map(p => ({
    id: p.id,
    nom: p.nom,
    quantite: p.quantite,
    seuil: p.quantite_seuil,
    cout_unitaire: p.prix,
    fournisseur: 'Fournisseur par défaut',
    date_peremption: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  // Filtrer les produits par le terme de recherche
  const filteredProducts = derivedProducts.filter(product =>
    product.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStock = async (productId: number, newQuantity: number) => {
    try {
      // Mettre à jour via l'API si disponible
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      const token = localStorage.getItem('access_token');
      if (token && isLocalhost) {
        try {
          const response = await fetch(`http://localhost:8000/products/${productId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantite: newQuantity })
          });

          if (!response.ok) {
            console.error('Erreur API lors de la mise à jour du stock');
          }
        } catch (apiError) {
          console.error('Erreur lors de la communication avec l\'API:', apiError);
        }
      }

      // Mettre à jour localement pour la synchronisation
      const savedProducts = localStorage.getItem('productStocks');
      if (savedProducts) {
        let productStocksData = JSON.parse(savedProducts);
        const productToUpdate = productStocksData.find((p: any) => p.id === productId);

        if (productToUpdate) {
          productToUpdate.quantite = newQuantity;
          productToUpdate.cogs = productToUpdate.prix * newQuantity;

          localStorage.setItem('productStocks', JSON.stringify(productStocksData));

          // Déclencher l'événement de synchronisation
          const event = new CustomEvent('product:updated', {
            detail: { product: productToUpdate }
          });
          window.dispatchEvent(event);

          toast.success('Stock mis à jour avec succès et synchronisé avec les autres modules');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Une erreur est survenue lors de la mise à jour du stock');
    }
  };

  const handleAddProduct = async () => {
    try {
      // Vérifier les données du formulaire
      if (!newProduct.nom || newProduct.quantite < 0 || newProduct.cout_unitaire <= 0) {
        toast.error('Veuillez remplir tous les champs obligatoires correctement');
        return;
      }

      // Ajouter le produit à l'API si disponible
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      const token = localStorage.getItem('access_token');
      if (token && isLocalhost) {
        try {
          const response = await fetch('http://localhost:8000/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
          });

          if (!response.ok) {
            console.error('Erreur API lors de l\'ajout du produit');
          }
        } catch (apiError) {
          console.error('Erreur lors de la communication avec l\'API:', apiError);
        }
      }

      // Ajouter le produit localement pour la synchronisation
      const newProductId = Math.max(...productStocks.map(p => p.id), 0) + 1;
      const productToAdd = {
        ...newProduct,
        id: newProductId,
        prix: newProduct.cout_unitaire,
        quantite_seuil: newProduct.seuil,
        cogs: newProduct.cout_unitaire * newProduct.quantite
      };

      const updatedProducts = [...productStocks, productToAdd];
      setProductStocks(updatedProducts);
      localStorage.setItem('productStocks', JSON.stringify(updatedProducts));

      // Déclencher l'événement de synchronisation
      const event = new CustomEvent('product:added', {
        detail: { product: productToAdd }
      });
      window.dispatchEvent(event);

      // Réinitialiser le formulaire
      setNewProduct({
        nom: '',
        quantite: 0,
        seuil: 5,
        cout_unitaire: 0,
        unite: 'pièces',
        fournisseur: '',
        date_peremption: ''
      });

      toast.success('Produit ajouté avec succès et synchronisé avec les autres modules');
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast.error('Une erreur est survenue lors de l\'ajout du produit');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        // Supprimer via l'API si disponible
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        const token = localStorage.getItem('access_token');
        if (token && isLocalhost) {
          try {
            const response = await fetch(`http://localhost:8000/products/${productId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              console.error('Erreur API lors de la suppression du produit');
            }
          } catch (apiError) {
            console.error('Erreur lors de la communication avec l\'API:', apiError);
          }
        }

        // Supprimer localement pour la synchronisation
        const savedProducts = localStorage.getItem('productStocks');
        if (savedProducts) {
          let productStocksData = JSON.parse(savedProducts);
          const productToDelete = productStocksData.find((p: any) => p.id === productId);

          if (productToDelete) {
            // Avant de supprimer, déclencher un événement pour informer de la suppression
            const deleteEvent = new CustomEvent('product:deleted', {
              detail: { product: productToDelete }
            });
            window.dispatchEvent(deleteEvent);

            // Supprimer le produit
            productStocksData = productStocksData.filter((p: any) => p.id !== productId);
            localStorage.setItem('productStocks', JSON.stringify(productStocksData));

            // Déclencher l'événement de mise à jour globale
            const updateEvent = new CustomEvent('productStocks:updated', {
              detail: { products: productStocksData }
            });
            window.dispatchEvent(updateEvent);

            toast.success('Produit supprimé avec succès');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Une erreur est survenue lors de la suppression du produit');
      }
    }
  };

  const handleUpdateAllProduct = async (updatedProduct: Product) => {
    try {
      // Mettre à jour via l'API si disponible
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      const token = localStorage.getItem('access_token');
      if (token && isLocalhost) {
        try {
          const response = await fetch(`http://localhost:8000/products/${updatedProduct.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nom: updatedProduct.nom,
              quantite: updatedProduct.quantite,
              quantite_seuil: updatedProduct.seuil,
              prix: updatedProduct.cout_unitaire
            })
          });

          if (!response.ok) {
            console.error('Erreur API lors de la mise à jour du produit');
          }
        } catch (apiError) {
          console.error('Erreur lors de la communication avec l\'API:', apiError);
        }
      }

      // Mettre à jour localement
      const savedProducts = localStorage.getItem('productStocks');
      if (savedProducts) {
        let productStocksData = JSON.parse(savedProducts);
        const productIndex = productStocksData.findIndex((p: any) => p.id === updatedProduct.id);

        if (productIndex !== -1) {
          productStocksData[productIndex] = {
            ...productStocksData[productIndex],
            nom: updatedProduct.nom,
            quantite: updatedProduct.quantite,
            quantite_seuil: updatedProduct.seuil,
            prix: updatedProduct.cout_unitaire,
            cogs: updatedProduct.quantite * updatedProduct.cout_unitaire
          };

          localStorage.setItem('productStocks', JSON.stringify(productStocksData));

          // Déclencher l'événement de synchronisation
          const event = new CustomEvent('product:updated', {
            detail: { product: productStocksData[productIndex] }
          });
          window.dispatchEvent(event);

          // Forcer le rafraîchissement
          setRefreshKey(prev => prev + 1);

          toast.success('Produit mis à jour avec succès');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Une erreur est survenue lors de la mise à jour du produit');
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { status: 'Rupture', color: 'text-red-600 bg-red-100' };
    if (quantity <= threshold) return { status: 'Faible', color: 'text-orange-600 bg-orange-100' };
    return { status: 'OK', color: 'text-green-600 bg-green-100' };
  };

  // Calculer le total des COGS
  const totalCOGS = derivedProducts.reduce((sum, product) => sum + (product.quantite * product.cout_unitaire), 0);

  const handleExportPDF = () => {
    try {
      const stockData = derivedProducts.map(product => ({
        id: product.id,
        nom: product.nom,
        quantite: product.quantite,
        prix: product.cout_unitaire,
        cogs: product.quantite * product.cout_unitaire,
        seuil: product.seuil,
        unite: 'unité',
        fournisseur: product.fournisseur
      }));

      PDFExporter.exportStockReport(stockData);
      toast.success('Rapport PDF généré avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(3, 34, 76, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4a148c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b' }}>Chargement du stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(3, 34, 76, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 182, 193, 0.2)'
      }}>

        {/* Header avec recherche */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ color: '#03224c', margin: 0, fontSize: '2rem', fontWeight: '700' }}>
            📦 Gestion du Stock
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #FFB6C1',
                borderRadius: '25px',
                fontSize: '1rem',
                minWidth: '200px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                ➕ Ajouter un produit
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  background: 'linear-gradient(135deg, #03224c 0%, #0f3460 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                📄 Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h3 style={{ color: '#03224c', marginBottom: '1rem' }}>➕ Nouveau produit</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <input
                type="text"
                placeholder="Nom du produit"
                value={newProduct.nom}
                onChange={(e) => setNewProduct({ ...newProduct, nom: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="number"
                placeholder="Quantité"
                value={newProduct.quantite}
                onChange={(e) => setNewProduct({ ...newProduct, quantite: parseInt(e.target.value) || 0 })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="number"
                placeholder="Seuil d'alerte"
                value={newProduct.seuil}
                onChange={(e) => setNewProduct({ ...newProduct, seuil: parseInt(e.target.value) || 0 })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Coût unitaire (TND)"
                value={newProduct.cout_unitaire}
                onChange={(e) => setNewProduct({ ...newProduct, cout_unitaire: parseFloat(e.target.value) || 0 })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="text"
                placeholder="Fournisseur"
                value={newProduct.fournisseur}
                onChange={(e) => setNewProduct({ ...newProduct, fournisseur: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="date"
                placeholder="Date de péremption"
                value={newProduct.date_peremption}
                onChange={(e) => setNewProduct({ ...newProduct, date_peremption: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              />
              <select
                value={newProduct.unite}
                onChange={(e) => setNewProduct({ ...newProduct, unite: e.target.value })}
                style={{ padding: '0.75rem', border: '2px solid #FFB6C1', borderRadius: '8px', fontSize: '1rem' }}
              >
                <option value="unité">Unité</option>
                <option value="kg">Kilogramme (kg)</option>
                <option value="g">Gramme (g)</option>
                <option value="L">Litre (L)</option>
                <option value="ml">Millilitre (ml)</option>
                <option value="pièce">Pièce</option>
                <option value="paquet">Paquet</option>
                <option value="boîte">Boîte</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAddProduct}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ✅ Sauvegarder
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        )}

        {/* Tableau des produits */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 182, 193, 0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Produit
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Stock J-1
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Stock Actuel
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Unité
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Seuil
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Statut
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Prix Unit. (TND)
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  COGS (TND)
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Fournisseur
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product.quantite, product.seuil);
                const yesterdayStock = stockYesterday.find(s => s.id === product.id)?.quantite || 0;
                const cogs = product.quantite * product.cout_unitaire;

                return (
                  <tr key={product.id} style={{
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    borderBottom: '1px solid rgba(255, 182, 193, 0.2)'
                  }}>
                    {/* Nom du produit */}
                    <td style={{ padding: '0.75rem', fontWeight: '600', color: '#03224c', fontSize: '0.9rem' }}>
                      {editingProduct?.id === product.id ? (
                        <input
                          type="text"
                          value={editingProduct.nom}
                          onChange={(e) => setEditingProduct({ ...editingProduct, nom: e.target.value })}
                          style={{ width: '120px', padding: '0.4rem', border: '2px solid #FFB6C1', borderRadius: '4px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        product.nom
                      )}
                    </td>

                    {/* Stock J-1 */}
                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.9rem' }}>
                      <span style={{
                        background: 'rgba(156, 163, 175, 0.1)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem'
                      }}>
                        {yesterdayStock}
                      </span>
                    </td>

                    {/* Stock Actuel */}
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {editingProduct?.id === product.id ? (
                        <input
                          type="number"
                          value={editingProduct.quantite}
                          onChange={(e) => setEditingProduct({ ...editingProduct, quantite: parseInt(e.target.value) || 0 })}
                          style={{ width: '70px', padding: '0.4rem', border: '2px solid #FFB6C1', borderRadius: '4px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        <span style={{ fontWeight: '600' }}>{product.quantite}</span>
                      )}
                    </td>

                    {/* Unité */}
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem'
                      }}>
                        unité
                      </span>
                    </td>

                    {/* Seuil */}
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {editingProduct?.id === product.id ? (
                        <input
                          type="number"
                          value={editingProduct.seuil}
                          onChange={(e) => setEditingProduct({ ...editingProduct, seuil: parseInt(e.target.value) || 0 })}
                          style={{ width: '60px', padding: '0.4rem', border: '2px solid #FFB6C1', borderRadius: '4px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        product.seuil
                      )}
                    </td>

                    {/* Statut */}
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: stockStatus.status === 'OK' ? 'rgba(16, 185, 129, 0.1)' :
                          stockStatus.status === 'Faible' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: stockStatus.status === 'OK' ? '#10b981' :
                          stockStatus.status === 'Faible' ? '#f59e0b' : '#ef4444'
                      }}>
                        {stockStatus.status}
                      </span>
                    </td>

                    {/* Prix Unitaire */}
                    <td style={{ padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>
                      {editingProduct?.id === product.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.cout_unitaire}
                          onChange={(e) => setEditingProduct({ ...editingProduct, cout_unitaire: parseFloat(e.target.value) || 0 })}
                          style={{ width: '80px', padding: '0.4rem', border: '2px solid #FFB6C1', borderRadius: '4px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        `${product.cout_unitaire.toFixed(2)} TND`
                      )}
                    </td>

                    {/* COGS */}
                    <td style={{ padding: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem'
                      }}>
                        {cogs.toFixed(2)} TND
                      </span>
                    </td>

                    {/* Fournisseur */}
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {editingProduct?.id === product.id ? (
                        <input
                          type="text"
                          value={editingProduct.fournisseur}
                          onChange={(e) => setEditingProduct({ ...editingProduct, fournisseur: e.target.value })}
                          style={{ width: '100px', padding: '0.4rem', border: '2px solid #FFB6C1', borderRadius: '4px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        product.fournisseur
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem' }}>
                      {editingProduct?.id === product.id ? (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            onClick={() => {
                              handleUpdateAllProduct(editingProduct);
                              setEditingProduct(null);
                            }}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Sauvegarder"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            style={{
                              background: '#64748b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Annuler"
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            onClick={() => setEditingProduct(product)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Résumé des COGS */}
        {filteredProducts.length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                  💰 Valeur Totale du Stock (COGS)
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                  Coût total des marchandises en stock
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '1rem 1.5rem',
                borderRadius: '10px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>
                  {totalCOGS.toFixed(2)} TND
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
                  {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'rgba(248, 250, 252, 0.7)',
            borderRadius: '12px',
            border: '2px dashed rgba(255, 182, 193, 0.4)',
            color: '#64748b',
            marginTop: '1rem'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ color: '#03224c', marginBottom: '0.5rem' }}>
              {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit en stock'}
            </h3>
            <p>
              {searchTerm
                ? `Aucun produit ne correspond à "${searchTerm}"`
                : 'Commencez par ajouter votre premier produit'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagerComponent;