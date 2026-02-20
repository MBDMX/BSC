import { useEffect } from 'react';
import { ProductStock } from '../hooks/useStockData';

// Interface pour les matières premières
interface StockIngredient {
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

// Composant invisible qui synchronise les données entre les différents tableaux
export default function StockSynchronizer() {
  
  // Synchroniser un produit ajouté avec les matières premières
  const syncProductToMatieres = (product: ProductStock) => {
    try {
      const savedMatieres = localStorage.getItem('matieresPremieres');
      let matieresPremieres: StockIngredient[] = [];
      
      if (savedMatieres) {
        matieresPremieres = JSON.parse(savedMatieres);
      }

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
        localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
        
        // Déclencher un événement pour notifier les composants
        window.dispatchEvent(new CustomEvent('matieresUpdated', {
          detail: { matieres: updatedMatieres }
        }));
      } else {
        // Mettre à jour la matière première existante
        const updatedMatieres = matieresPremieres.map(m => 
          m.id === existingMatiere.id 
            ? { ...m, quantite_stock: product.quantite, prix_achat: product.prix }
            : m
        );
        localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
        
        window.dispatchEvent(new CustomEvent('matieresUpdated', {
          detail: { matieres: updatedMatieres }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec les matières premières:', error);
    }
  };

  // Supprimer un élément de tous les tableaux
  const deleteFromAllTables = (id: number, nom: string) => {
    try {
      // Supprimer des matières premières (par nom car les IDs peuvent être différents)
      const savedMatieres = localStorage.getItem('matieresPremieres');
      if (savedMatieres) {
        const matieresPremieres: StockIngredient[] = JSON.parse(savedMatieres);
        const updatedMatieres = matieresPremieres.filter(m => 
          m.nom.toLowerCase() !== nom.toLowerCase()
        );
        localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
        
        window.dispatchEvent(new CustomEvent('matieresUpdated', {
          detail: { matieres: updatedMatieres }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression synchronisée:', error);
    }
  };

  // Mettre à jour les matières premières quand un produit est modifié
  const updateMatiereFromProduct = (product: ProductStock) => {
    try {
      const savedMatieres = localStorage.getItem('matieresPremieres');
      if (savedMatieres) {
        const matieresPremieres: StockIngredient[] = JSON.parse(savedMatieres);
        const updatedMatieres = matieresPremieres.map(m => 
          m.nom.toLowerCase() === product.nom.toLowerCase()
            ? { 
                ...m, 
                quantite_stock: product.quantite, 
                seuil_reapprovisionnement: product.quantite_seuil,
                prix_achat: product.prix
              }
            : m
        );
        localStorage.setItem('matieresPremieres', JSON.stringify(updatedMatieres));
        
        window.dispatchEvent(new CustomEvent('matieresUpdated', {
          detail: { matieres: updatedMatieres }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour synchronisée:', error);
    }
  };

  useEffect(() => {
    // Écouter les événements de produits ajoutés
    const handleProductAdded = (e: CustomEvent) => {
      syncProductToMatieres(e.detail.product);
    };

    // Écouter les événements de produits supprimés
    const handleProductDeleted = (e: CustomEvent) => {
      deleteFromAllTables(e.detail.id, e.detail.nom);
    };

    // Écouter les événements de produits modifiés
    const handleProductUpdated = (e: CustomEvent) => {
      if (e.detail.product) {
        updateMatiereFromProduct(e.detail.product);
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('productAdded', handleProductAdded as EventListener);
    window.addEventListener('productDeleted', handleProductDeleted as EventListener);
    window.addEventListener('productUpdated', handleProductUpdated as EventListener);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('productAdded', handleProductAdded as EventListener);
      window.removeEventListener('productDeleted', handleProductDeleted as EventListener);
      window.removeEventListener('productUpdated', handleProductUpdated as EventListener);
    };
  }, []);

  // Ce composant ne rend rien, il ne fait que synchroniser les données
  return null;
}