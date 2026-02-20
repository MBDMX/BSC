// Gestionnaire centralisé des ingrédients pour toute l'application

export interface Product {
  id: number;
  nom: string;
  quantite: number;
  seuil: number;
  prix_unitaire: number;
  unite: string;
}

export class IngredientsManager {
  private static STORAGE_KEY = 'global-ingredients';
  private static YESTERDAY_KEY_PREFIX = 'yesterday-ingredients-';

  // Fonction pour déterminer l'unité appropriée selon le produit
  static getAppropriateUnit(productName: string): string {
    const name = productName.toLowerCase();
    
    if (name.includes('pomme de terre') || name.includes('patate') || name.includes('viande') || 
        name.includes('steak') || name.includes('bacon') || name.includes('fromage') ||
        name.includes('salade') || name.includes('tomate') || name.includes('oignon')) {
      return 'kg';
    }
    
    if (name.includes('lait') || name.includes('huile') || name.includes('sauce') || 
        name.includes('coca') || name.includes('soda') || name.includes('jus')) {
      return 'L';
    }
    
    if (name.includes('pain') || name.includes('burger') || name.includes('œuf') || name.includes('oeuf')) {
      return 'unité';
    }
    
    if (name.includes('sel') || name.includes('poivre') || name.includes('épice') || name.includes('sucre')) {
      return 'g';
    }
    
    return 'unité';
  }

  // Charger les ingrédients actuels
  static getCurrentIngredients(): Product[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : this.getDefaultIngredients();
    } catch (error) {
      console.error('Erreur chargement ingrédients:', error);
      return this.getDefaultIngredients();
    }
  }

  // Sauvegarder les ingrédients actuels
  static saveCurrentIngredients(ingredients: Product[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ingredients));
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('ingredients-updated', { detail: ingredients }));
    } catch (error) {
      console.error('Erreur sauvegarde ingrédients:', error);
    }
  }

  // Charger les ingrédients d'hier
  static getYesterdayIngredients(): Product[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = `${this.YESTERDAY_KEY_PREFIX}${yesterday.toISOString().split('T')[0]}`;
    
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      // Si pas de données d'hier, créer à partir des ingrédients actuels avec des quantités différentes
      return this.generateYesterdayStock();
    } catch (error) {
      console.error('Erreur chargement stock hier:', error);
      return this.generateYesterdayStock();
    }
  }

  // Synchroniser les ingrédients d'hier avec les actuels (même liste, quantités différentes)
  static syncYesterdayIngredients(currentIngredients: Product[]): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = `${this.YESTERDAY_KEY_PREFIX}${yesterday.toISOString().split('T')[0]}`;
    
    // Récupérer les quantités d'hier existantes ou générer nouvelles
    const existingYesterday = this.getYesterdayIngredients();
    const yesterdayMap = new Map(existingYesterday.map(item => [item.nom, item.quantite]));
    
    // Créer la nouvelle liste d'hier basée sur les ingrédients actuels
    const syncedYesterday = currentIngredients.map(current => ({
      ...current,
      quantite: yesterdayMap.get(current.nom) || current.quantite + (Math.random() * 10 - 5) // Variation aléatoire si nouveau
    }));
    
    try {
      localStorage.setItem(key, JSON.stringify(syncedYesterday));
    } catch (error) {
      console.error('Erreur sync stock hier:', error);
    }
  }

  // Ajouter un nouvel ingrédient
  static addIngredient(ingredient: Omit<Product, 'id'>): Product {
    const currentIngredients = this.getCurrentIngredients();
    const newIngredient: Product = {
      ...ingredient,
      id: Math.max(...currentIngredients.map(p => p.id), 0) + 1,
      unite: this.getAppropriateUnit(ingredient.nom)
    };
    
    const updatedIngredients = [...currentIngredients, newIngredient];
    this.saveCurrentIngredients(updatedIngredients);
    this.syncYesterdayIngredients(updatedIngredients);
    
    return newIngredient;
  }

  // Supprimer un ingrédient
  static deleteIngredient(ingredientId: number): void {
    const currentIngredients = this.getCurrentIngredients();
    const updatedIngredients = currentIngredients.filter(ing => ing.id !== ingredientId);
    
    this.saveCurrentIngredients(updatedIngredients);
    this.syncYesterdayIngredients(updatedIngredients);
  }

  // Mettre à jour un ingrédient
  static updateIngredient(ingredientId: number, updates: Partial<Product>): void {
    const currentIngredients = this.getCurrentIngredients();
    const updatedIngredients = currentIngredients.map(ing =>
      ing.id === ingredientId ? { ...ing, ...updates } : ing
    );
    
    this.saveCurrentIngredients(updatedIngredients);
    this.syncYesterdayIngredients(updatedIngredients);
  }

  // Obtenir les ingrédients par défaut
  static getDefaultIngredients(): Product[] {
    return [
      { id: 1, nom: 'Pomme de terre', quantite: 25.5, seuil: 10, prix_unitaire: 1.2, unite: 'kg' },
      { id: 2, nom: 'Pain burger', quantite: 150, seuil: 50, prix_unitaire: 0.8, unite: 'unité' },
      { id: 3, nom: 'Steak haché', quantite: 8.2, seuil: 3, prix_unitaire: 12.5, unite: 'kg' },
      { id: 4, nom: 'Lait', quantite: 4.5, seuil: 2, prix_unitaire: 1.8, unite: 'L' },
      { id: 5, nom: 'Fromage cheddar', quantite: 200, seuil: 100, prix_unitaire: 0.4, unite: 'unité' },
      { id: 6, nom: 'Coca Cola 33cl', quantite: 48, seuil: 24, prix_unitaire: 0.8, unite: 'unité' },
      { id: 7, nom: 'Huile de friture', quantite: 12, seuil: 5, prix_unitaire: 2.5, unite: 'L' },
      { id: 8, nom: 'Sel', quantite: 1500, seuil: 500, prix_unitaire: 0.001, unite: 'g' },
      { id: 9, nom: 'Salade', quantite: 5.2, seuil: 2, prix_unitaire: 2.0, unite: 'kg' },
      { id: 10, nom: 'Tomate', quantite: 3.8, seuil: 1.5, prix_unitaire: 3.5, unite: 'kg' },
      { id: 11, nom: 'Oignon', quantite: 2.1, seuil: 1, prix_unitaire: 1.8, unite: 'kg' },
      { id: 12, nom: 'Bacon', quantite: 1.5, seuil: 0.5, prix_unitaire: 18.0, unite: 'kg' }
    ];
  }

  // Générer le stock d'hier avec des variations
  private static generateYesterdayStock(): Product[] {
    const currentIngredients = this.getCurrentIngredients();
    return currentIngredients.map(ingredient => ({
      ...ingredient,
      quantite: ingredient.quantite + (Math.random() * 20 - 10) // Variation de ±10
    }));
  }

  // Réinitialiser complètement les données
  static resetAllData(): void {
    try {
      // Lancer le gestionnaire global de données
      const { GlobalDataManager } = require('./globalDataManager');
      GlobalDataManager.clearAllData();
      
      // Réinitialiser avec les données par défaut
      const defaultIngredients = this.getDefaultIngredients();
      this.saveCurrentIngredients(defaultIngredients);
      this.syncYesterdayIngredients(defaultIngredients);
      
      // Déclencher un événement de réinitialisation
      window.dispatchEvent(new CustomEvent('app-reset'));
      window.dispatchEvent(new CustomEvent('global-data-reset'));
      
      console.log('✅ Toutes les données ont été réinitialisées globalement');
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
    }
  }

  // Obtenir la liste des noms d'ingrédients pour les sélecteurs
  static getIngredientNames(): string[] {
    return this.getCurrentIngredients().map(ing => ing.nom);
  }

  // Obtenir un ingrédient par nom
  static getIngredientByName(name: string): Product | undefined {
    return this.getCurrentIngredients().find(ing => ing.nom === name);
  }
}