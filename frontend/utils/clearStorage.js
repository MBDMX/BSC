// Script pour vider complètement le localStorage
// À exécuter dans la console du navigateur

// Supprimer toutes les données de l'application
localStorage.removeItem('menuProduits');
localStorage.removeItem('menuCategories');
localStorage.removeItem('matieresPremieres');
localStorage.removeItem('stockData');
localStorage.removeItem('cache_notifications');

// Optionnel : vider complètement le localStorage
// localStorage.clear();

console.log('✅ Toutes les données ont été supprimées. Rechargez la page.');