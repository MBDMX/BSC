import { useState, useEffect, useCallback } from 'react';
import { ProductStock, StockYesterday } from './useStockData';

// Interface pour les matières premières
export interface StockIngredient {
  id: number;
  nom: string;
  code: string;
  unite: string;
  quantite_stock: number;
  seuil_reapprovisionnement: number;
  prix_achat: number;
  fournisseur: string;
  date_peremption: string;
  categorie: string;
  created_at?: string;
}

// Hook global pour synchroniser toutes les données de stock du site
export const useGlobalStock = () => {
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [stockYesterday, setStockYesterday] = useState<StockYesterday[]>([]);
  const [matieresPremieres, setMatieresPremieres] = useState<StockIngredient[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger toutes les données depuis localStorage
  const loadAllData = useCallback(() => {
    try {
      // Charger les stocks de produits
      const savedProductStocks = localStorage.getItem('productStocks');
      if (savedProductStocks) {
        setProductStocks(JSON.parse(savedProductStocks));
      }

      // Charger le stock de la veille
      const savedStockYesterday = localStorage.getItem('stockYesterday');
      if (savedStockYesterday) {
        setStockYesterday(JSON.parse(savedStockYesterday));
      }

      // Charger les matières premières
      const savedMatieres = localStorage.getItem('matieresPremieres');
      if (savedMatieres) {
        setMatieresPremieres(JSON.parse(savedMatieres));
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Erreur lors du chargement des données globales:', error);
      setIsLoaded(true);
    }
  }, []);

  // Synchroniser un produit ajouté dans le dashboard avec les matières premières
  const syncProductToMatieres = useCallback((product: ProductStock) => {
    const existingMatiere = matieresPremieres.find(m => 
      m.nom.toLowerCase() === product.nom.toLowerCase()
    );

    if (!existingMatiere) {
      // Créer une nouvelle matière première basée sur le produit
      const newMatiere: StockIngredient = {
        id: Math.max(...matieresPremieres.map(m => m.id), 0) + 1,
        nom: product.nom,
        code: `PROD-${product.id.toString().padStart(3, '0')}`,
        unite: 'unité',
        quantite_stock: product.quantite,
        seuil_reapprovisionnement: product.quantite_seuil,
        prix_achat: product.prix,
        fournisseur: 'Fournisseur par défaut',
        date_peremption: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
        categorie: 'Produits',
        created_at: new Date().toISOString()
      };

      const updatedMatieres = [...matieresPremieres, newMatiere];
      setMatieresPremieres(updatedMatieres);
      localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
    } else {
      // Mettre à jour la matière première existante
      const updatedMatieres = matieresPremieres.map(m => 
        m.id === existingMatiere.id 
          ? { ...m, quantite_stock: product.quantite, prix_achat: product.prix }
          : m
      );
      setMatieresPremieres(updatedMatieres);
      localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
    }
  }, [matieresPremieres]);

  // Synchroniser une matière première modifiée avec les produits
  const syncMatiereToProducts = useCallback((matiere: StockIngredient) => {
    const existingProduct = productStocks.find(p => 
      p.nom.toLowerCase() === matiere.nom.toLowerCase()
    );

    if (existingProduct) {
      // Mettre à jour le produit existant
      const updatedProducts = productStocks.map(p => 
        p.id === existingProduct.id 
          ? { 
              ...p, 
              quantite: matiere.quantite_stock, 
              quantite_seuil: matiere.seuil_reapprovisionnement,
              prix: matiere.prix_achat,
              cogs: matiere.quantite_stock * matiere.prix_achat
            }
          : p
      );
      setProductStocks(updatedProducts);
      localStorage.setItem('productStocks', JSON.stringify(updatedProducts));

      // Mettre à jour aussi le stock de la veille
      const updatedStockYesterday = stockYesterday.map(s => 
        s.id === existingProduct.id 
          ? { 
              ...s, 
              nom: matiere.nom,
              quantite_restante: matiere.quantite_stock,
              etat: matiere.quantite_stock > matiere.seuil_reapprovisionnement ? 'OK' as const : 'Rupture' as const
            }
          : s
      );
      setStockYesterday(updatedStockYesterday);
      localStorage.setItem('stockYesterday', JSON.stringify(updatedStockYesterday));
    }
  }, [productStocks, stockYesterday]);

  // Supprimer un élément de tous les tableaux
  const deleteFromAllTables = useCallback((id: number, nom: string) => {
    // Supprimer des produits
    const updatedProducts = productStocks.filter(p => p.id !== id);
    setProductStocks(updatedProducts);
    localStorage.setItem('productStocks', JSON.stringify(updatedProducts));

    // Supprimer du stock de la veille
    const updatedStockYesterday = stockYesterday.filter(s => s.id !== id);
    setStockYesterday(updatedStockYesterday);
    localStorage.setItem('stockYesterday', JSON.stringify(updatedStockYesterday));

    // Supprimer des matières premières (par nom car les IDs peuvent être différents)
    const updatedMatieres = matieresPremieres.filter(m => 
      m.nom.toLowerCase() !== nom.toLowerCase()
    );
    setMatieresPremieres(updatedMatieres);
    localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
  }, [productStocks, stockYesterday, matieresPremieres]);

  // Écouter les changements dans localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productStocks' || e.key === 'stockYesterday' || e.key === 'matieresPremieres') {
        loadAllData();
      }
    };

    const handleCustomUpdate = (e: CustomEvent) => {
      if (e.detail.productStocks) setProductStocks(e.detail.productStocks);
      if (e.detail.stockYesterday) setStockYesterday(e.detail.stockYesterday);
      if (e.detail.matieresPremieres) setMatieresPremieres(e.detail.matieresPremieres);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('globalStockUpdated', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('globalStockUpdated', handleCustomUpdate as EventListener);
    };
  }, [loadAllData]);

  // Charger les données au montage
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Déclencher un événement global quand les données changent
  const notifyGlobalUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('globalStockUpdated', {
      detail: { productStocks, stockYesterday, matieresPremieres }
    }));
  }, [productStocks, stockYesterday, matieresPremieres]);

  return {
    productStocks,
    stockYesterday,
    matieresPremieres,
    isLoaded,
    syncProductToMatieres,
    syncMatiereToProducts,
    deleteFromAllTables,
    loadAllData,
    notifyGlobalUpdate
  };
};