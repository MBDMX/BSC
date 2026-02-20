// Gestionnaire global pour nettoyer et synchroniser toutes les données

export class GlobalDataManager {
  // Liste de toutes les clés utilisées dans l'application
  private static readonly ALL_STORAGE_KEYS = [
    // Ingrédients et stock
    'global-ingredients',
    'stock-products',
    'matieres-premieres',
    
    // Menu
    'menu-items',
    'menu-products',
    
    // Ventes et rapports
    'sales-data',
    'monthly-reports',
    'stock-movements',
    'sales-reports',
    'monthly-data',
    
    // Anciens systèmes
    'products',
    'ingredients',
    'sales',
    'reports',
    'dashboard-data',
    
    // Données fantômes possibles
    'menu-list',
    'product-list',
    'ingredient-list'
  ];

  // Nettoyer complètement toutes les données
  static async clearAllData(): Promise<void> {
    console.log('🧹 Nettoyage complet des données...');
    
    try {
      // Supprimer toutes les clés connues
      this.ALL_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
        console.log(`❌ Supprimé: ${key}`);
      });

      // Supprimer les clés avec dates (hier, etc.)
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('yesterday-') || 
            key.includes('date-') || 
            key.includes('daily-') ||
            key.includes('2024-') ||
            key.includes('report-')) {
          localStorage.removeItem(key);
          console.log(`❌ Supprimé (date): ${key}`);
        }
      });

      // Vider complètement le localStorage (sauf auth si nécessaire)
      const keysToKeep = ['auth-user', 'login-status'];
      const currentAuth = keysToKeep.map(key => ({ key, value: localStorage.getItem(key) }));
      
      localStorage.clear();
      
      // Restaurer l'auth
      currentAuth.forEach(({ key, value }) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });

      console.log('✅ Nettoyage complet terminé');
      
      // Déclencher un événement global de reset
      window.dispatchEvent(new CustomEvent('global-data-reset'));
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }

  // Initialiser les données par défaut
  static initializeDefaultData(): void {
    console.log('🔄 Initialisation des données par défaut...');
    
    // Utiliser le gestionnaire d'ingrédients pour les données par défaut
    const { IngredientsManager } = require('./ingredientsManager');
    const defaultIngredients = IngredientsManager.getDefaultIngredients();
    IngredientsManager.saveCurrentIngredients(defaultIngredients);
    IngredientsManager.syncYesterdayIngredients(defaultIngredients);
    
    console.log('✅ Données par défaut initialisées');
  }

  // Reset complet avec confirmation
  static async performFullReset(): Promise<void> {
    await this.clearAllData();
    this.initializeDefaultData();
    
    // Recharger la page après reset
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}