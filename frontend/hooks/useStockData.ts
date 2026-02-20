import { useState, useEffect, useCallback } from 'react';

// Types pour les données de stock
export interface ProductStock {
  id: number;
  nom: string;
  quantite: number;
  quantite_seuil: number;
  prix: number;
  cogs: number;
}

export interface StockYesterday {
  id: number;
  nom: string;
  quantite_initial: number;
  quantite_vendue: number;
  quantite_restante: number;
  etat: 'OK' | 'Rupture';
  date: string;
}

// Hook personnalisé pour gérer les données de stock de manière centralisée
export const useStockData = () => {
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [stockYesterday, setStockYesterday] = useState<StockYesterday[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Données par défaut
  const defaultProductStocks: ProductStock[] = [
    {
      id: 1,
      nom: "Viande hachée",
      quantite: 35,
      quantite_seuil: 10,
      prix: 12.0,
      cogs: 420.0
    },
    {
      id: 2,
      nom: "Pain burger",
      quantite: 55,
      quantite_seuil: 20,
      prix: 0.5,
      cogs: 27.5
    },
    {
      id: 3,
      nom: "Fromage",
      quantite: 2,
      quantite_seuil: 5,
      prix: 8.0,
      cogs: 16.0
    },
    {
      id: 4,
      nom: "Salade",
      quantite: 3,
      quantite_seuil: 5,
      prix: 3.0,
      cogs: 9.0
    },
    {
      id: 5,
      nom: "Tomate",
      quantite: 8,
      quantite_seuil: 5,
      prix: 2.5,
      cogs: 20.0
    }
  ];

  const defaultStockYesterday: StockYesterday[] = [
    {
      id: 1,
      nom: "Viande hachée",
      quantite_initial: 50,
      quantite_vendue: 15,
      quantite_restante: 35,
      etat: "OK",
      date: "2024-01-14"
    },
    {
      id: 2,
      nom: "Pain burger",
      quantite_initial: 100,
      quantite_vendue: 45,
      quantite_restante: 55,
      etat: "OK",
      date: "2024-01-14"
    },
    {
      id: 3,
      nom: "Fromage",
      quantite_initial: 20,
      quantite_vendue: 18,
      quantite_restante: 2,
      etat: "Rupture",
      date: "2024-01-14"
    },
    {
      id: 4,
      nom: "Salade",
      quantite_initial: 15,
      quantite_vendue: 12,
      quantite_restante: 3,
      etat: "Rupture",
      date: "2024-01-14"
    }
  ];

  // Charger les données depuis localStorage (sans useCallback pour éviter les boucles)
  const loadData = () => {
    try {
      const savedProductStocks = localStorage.getItem('productStocks');
      const savedStockYesterday = localStorage.getItem('stockYesterday');

      if (savedProductStocks) {
        const parsedProductStocks = JSON.parse(savedProductStocks);
        setProductStocks(parsedProductStocks);
      } else {
        setProductStocks(defaultProductStocks);
        localStorage.setItem('productStocks', JSON.stringify(defaultProductStocks));
      }

      if (savedStockYesterday) {
        const parsedStockYesterday = JSON.parse(savedStockYesterday);
        setStockYesterday(parsedStockYesterday);
      } else {
        setStockYesterday(defaultStockYesterday);
        localStorage.setItem('stockYesterday', JSON.stringify(defaultStockYesterday));
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setProductStocks(defaultProductStocks);
      setStockYesterday(defaultStockYesterday);
      setIsLoaded(true);
    }
  };

  // Sauvegarder les données dans localStorage
  const saveData = useCallback((newProductStocks: ProductStock[], newStockYesterday: StockYesterday[]) => {
    try {
      localStorage.setItem('productStocks', JSON.stringify(newProductStocks));
      localStorage.setItem('stockYesterday', JSON.stringify(newStockYesterday));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('stockDataUpdated', {
        detail: { productStocks: newProductStocks, stockYesterday: newStockYesterday }
      }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, []);

  // Obtenir la date actuelle
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Ajouter un nouveau produit
  const addProduct = useCallback((newProduct: Omit<ProductStock, 'id' | 'cogs'>) => {
    const newId = Math.max(...productStocks.map(p => p.id), 0) + 1;
    const cogs = newProduct.quantite * newProduct.prix;
    
    const newProductStock: ProductStock = {
      id: newId,
      nom: newProduct.nom,
      quantite: newProduct.quantite,
      quantite_seuil: newProduct.quantite_seuil,
      prix: newProduct.prix,
      cogs: cogs
    };

    const updatedProductStocks = [...productStocks, newProductStock];
    
    // Ajouter également au stock de la veille
    const newYesterdayStock: StockYesterday = {
      id: newId,
      nom: newProduct.nom,
      quantite_initial: newProduct.quantite,
      quantite_vendue: 0,
      quantite_restante: newProduct.quantite,
      etat: newProduct.quantite > newProduct.quantite_seuil ? 'OK' as const : 'Rupture' as const,
      date: getCurrentDate()
    };
    
    const updatedStockYesterday = [...stockYesterday, newYesterdayStock];
    
    setProductStocks(updatedProductStocks);
    setStockYesterday(updatedStockYesterday);
    saveData(updatedProductStocks, updatedStockYesterday);
    
    // Déclencher un événement pour synchroniser avec les matières premières
    window.dispatchEvent(new CustomEvent('productAdded', {
      detail: { product: newProductStock }
    }));
    
    return newProductStock;
  }, [productStocks, stockYesterday, saveData]);

  // Mettre à jour un produit
  const updateProduct = useCallback((id: number, updates: Partial<ProductStock>) => {
    const updatedProductStocks = productStocks.map(p => {
      if (p.id !== id) return p;
      const quantite = Number(updates.quantite ?? p.quantite) || 0;
      const prix = Number(updates.prix ?? p.prix) || 0;
      return {
        ...p,
        ...updates,
        quantite,
        prix,
        cogs: quantite * prix,
      } as ProductStock;
    });
    
    // Trouver le produit modifié pour mettre à jour le stock de la veille
    const modifiedProduct = updatedProductStocks.find(p => p.id === id);
    
    if (modifiedProduct) {
      const updatedStockYesterday = stockYesterday.map(item => {
        if (item.id !== id) return item;
        
        const quantiteVendue = Math.max(0, item.quantite_initial - modifiedProduct.quantite);
        
        return {
          ...item,
          nom: modifiedProduct.nom,
          quantite_restante: modifiedProduct.quantite,
          quantite_vendue: quantiteVendue,
          etat: modifiedProduct.quantite > modifiedProduct.quantite_seuil ? 'OK' as const : 'Rupture' as const,
          date: getCurrentDate()
        };
      });
      
      // Si le produit n'existe pas dans le stock de la veille, l'ajouter
      if (!stockYesterday.some(item => item.id === id)) {
        const newYesterdayStock: StockYesterday = {
          id: id,
          nom: modifiedProduct.nom,
          quantite_initial: modifiedProduct.quantite,
          quantite_vendue: 0,
          quantite_restante: modifiedProduct.quantite,
          etat: modifiedProduct.quantite > modifiedProduct.quantite_seuil ? 'OK' as const : 'Rupture' as const,
          date: getCurrentDate()
        };
        
        updatedStockYesterday.push(newYesterdayStock);
      }
      
      setProductStocks(updatedProductStocks);
      setStockYesterday(updatedStockYesterday);
      saveData(updatedProductStocks, updatedStockYesterday);
      
      // Déclencher un événement pour synchroniser la modification
      window.dispatchEvent(new CustomEvent('productUpdated', {
        detail: { id, updates, product: modifiedProduct }
      }));
    }
  }, [productStocks, stockYesterday, saveData]);

  // Supprimer un produit
  const deleteProduct = useCallback((id: number) => {
    const productToDelete = productStocks.find(p => p.id === id);
    const updatedProductStocks = productStocks.filter(p => p.id !== id);
    const updatedStockYesterday = stockYesterday.filter(item => item.id !== id);
    
    setProductStocks(updatedProductStocks);
    setStockYesterday(updatedStockYesterday);
    saveData(updatedProductStocks, updatedStockYesterday);
    
    // Déclencher un événement pour synchroniser la suppression
    if (productToDelete) {
      window.dispatchEvent(new CustomEvent('productDeleted', {
        detail: { id, nom: productToDelete.nom }
      }));
    }
  }, [productStocks, stockYesterday, saveData]);

  // Écouter les changements de données depuis d'autres composants
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productStocks' || e.key === 'stockYesterday') {
        loadData();
      }
    };

    const handleCustomUpdate = (e: CustomEvent) => {
      setProductStocks(e.detail.productStocks);
      setStockYesterday(e.detail.stockYesterday);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('stockDataUpdated', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stockDataUpdated', handleCustomUpdate as EventListener);
    };
  }, []); // Pas de dépendances pour éviter les re-executions

  // Charger les données au montage (une seule fois)
  useEffect(() => {
    if (!isLoaded) {
      loadData();
    }
  }, []); // Seulement au montage

  return {
    productStocks,
    stockYesterday,
    isLoaded,
    addProduct,
    updateProduct,
    deleteProduct,
    loadData
  };
};