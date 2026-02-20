// Script de nettoyage complet des données localStorage
// Utiliser dans la console du navigateur

function clearAllApplicationData() {
  console.log('🧹 Démarrage du nettoyage complet...');
  
  // Liste exhaustive de toutes les clés possibles
  const allPossibleKeys = [
    // Nouvelles clés synchronisées
    'global-ingredients',
    'synchronized-sales',
    'synchronized-monthly-movements',
    
    // Anciennes clés ingrédients/stock
    'stock-products',
    'matieres-premieres',
    'matieresPremieres',
    'ingredients',
    'products',
    
    // Anciennes clés menu
    'menu-items',
    'menu-products',
    'menuProduits',
    'menu-list',
    'product-list',
    
    // Anciennes clés ventes
    'sales-data',
    'gestionVentes',
    'sales',
    'ventes',
    
    // Anciennes clés rapports
    'monthly-reports',
    'bilanMovements',
    'stock-movements',
    'monthly-data',
    'reports',
    'bilan',
    
    // Données fantômes
    'ZARA',
    'arta',
    '2burger',
    'dashboard-data',
    'ingredient-list'
  ];
  
  // Supprimer toutes les clés connues
  allPossibleKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`❌ Supprimé: ${key}`);
    }
  });
  
  // Supprimer toutes les clés avec dates
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
  
  // Afficher les clés restantes (pour debug)
  const remainingKeys = Object.keys(localStorage);
  console.log('🔍 Clés restantes dans localStorage:', remainingKeys);
  
  console.log('✅ Nettoyage terminé !');
  console.log('🔄 Rechargement de la page recommandé...');
  
  return {
    cleared: allPossibleKeys.length,
    remaining: remainingKeys
  };
}

// Fonction à exécuter dans la console
console.log('📝 Pour nettoyer complètement les données, exécutez: clearAllApplicationData()');

// Export pour usage programmatique
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearAllApplicationData };
}