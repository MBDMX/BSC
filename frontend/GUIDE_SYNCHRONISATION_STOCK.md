# 🔄 Guide de Synchronisation des Stocks

## 📋 Problème Résolu

✅ **AVANT** : Les modifications et suppressions dans le tableau "📋Tableau des Stocks et COGS" ne se sauvegardaient pas. Quand on quittait et revenait ou on rafraîchissait, tout était écrasé.

✅ **MAINTENANT** : Toutes les modifications sont automatiquement sauvegardées et synchronisées dans tout le site !

## 🏗️ Architecture de la Solution

### 1. Hook Centralisé (`useStockData.ts`)
- **Fonction** : Gestion centralisée de toutes les données de stock
- **Sauvegarde** : Automatique dans localStorage à chaque modification
- **Synchronisation** : Événements personnalisés pour notifier les autres composants

### 2. Composant de Synchronisation (`StockSynchronizer.tsx`)
- **Fonction** : Écoute les événements et synchronise les données entre les tableaux
- **Synchronisation** : Produits ↔ Matières Premières
- **Invisible** : Ne rend rien, travaille en arrière-plan

### 3. Notifications (`SyncNotification.tsx`)
- **Fonction** : Informe l'utilisateur des synchronisations
- **Feedback** : Toasts et indicateur de dernière synchronisation

## 🔄 Flux de Synchronisation

### Ajout d'un Produit
1. **Dashboard** → Ajouter un produit dans "📋Tableau des Stocks et COGS"
2. **Hook** → Sauvegarde dans localStorage + déclenche événement `productAdded`
3. **Synchronizer** → Écoute l'événement et ajoute automatiquement dans "🧪 Matières Premières"
4. **Notification** → Affiche "✅ Produit ajouté et synchronisé dans tout le site!"

### Modification d'un Produit
1. **Dashboard** → Modifier un produit (nom, quantité, prix, etc.)
2. **Hook** → Sauvegarde + déclenche événement `productUpdated`
3. **Synchronizer** → Met à jour les matières premières correspondantes
4. **Notification** → Affiche "🔄 Produit mis à jour et synchronisé!"

### Suppression d'un Produit
1. **Dashboard** → Supprimer un produit
2. **Hook** → Supprime de localStorage + déclenche événement `productDeleted`
3. **Synchronizer** → Supprime de tous les tableaux du site
4. **Notification** → Affiche "🗑️ Produit supprimé de tout le site!"

## 📊 Données Synchronisées

### Tableaux Connectés
- **📋 Tableau des Stocks et COGS** (Dashboard)
- **📊 Stock de la Veille** (Dashboard)
- **🧪 Matières Premières** (Dashboard)
- **📦 Gestion du Stock** (Page Stock)

### Champs Synchronisés
- **Nom du produit**
- **Quantité en stock**
- **Quantité seuil**
- **Prix/Coût unitaire**
- **COGS (Cost of Goods Sold)**
- **État (OK/Rupture)**

## 🛠️ Utilisation

### Pour l'Utilisateur
1. **Ajoutez** un produit dans n'importe quel tableau
2. **Modifiez** les quantités, prix, ou noms
3. **Supprimez** des produits
4. **Naviguez** entre les pages - tout reste synchronisé !

### Indicateurs Visuels
- **⏳** : Chargement des données
- **✅** : Produit ajouté avec succès
- **🔄** : Données synchronisées
- **🗑️** : Produit supprimé
- **🔄 Dernière sync: XX:XX** : Indicateur en bas à droite

## 🔧 Fonctionnalités Techniques

### Sauvegarde Automatique
```typescript
// Chaque modification déclenche automatiquement :
localStorage.setItem('productStocks', JSON.stringify(data));
localStorage.setItem('stockYesterday', JSON.stringify(data));
localStorage.setItem('matieresPremieres', JSON.stringify(data));
```

### Événements de Synchronisation
```typescript
// Événements déclenchés automatiquement :
window.dispatchEvent(new CustomEvent('productAdded', { detail: { product } }));
window.dispatchEvent(new CustomEvent('productUpdated', { detail: { product } }));
window.dispatchEvent(new CustomEvent('productDeleted', { detail: { id, nom } }));
```

### Écoute Multi-Composants
```typescript
// Chaque composant écoute les changements :
window.addEventListener('productAdded', handleProductAdded);
window.addEventListener('storage', handleStorageChange);
```

## 🎯 Avantages

### ✅ Persistance Garantie
- **Aucune perte de données** lors du refresh ou navigation
- **Sauvegarde instantanée** à chaque modification
- **Récupération automatique** au rechargement

### ✅ Cohérence Globale
- **Synchronisation temps réel** entre tous les tableaux
- **Données unifiées** dans tout le site
- **Pas de doublons** ou d'incohérences

### ✅ Expérience Utilisateur
- **Feedback visuel** pour chaque action
- **Notifications informatives** 
- **Interface réactive** et moderne

## 🚀 Pages Synchronisées

1. **Dashboard** (`/dashboard`)
   - Onglet "📦 Gestion Stock"
   - Onglet "🧪 Matières Premières"

2. **Page Stock** (`/stock`)
   - Tableau principal des produits

3. **Futures Pages**
   - Toute nouvelle page utilisant `useStockData()` sera automatiquement synchronisée

## 🔍 Débogage

### Vérifier les Données
```javascript
// Dans la console du navigateur :
console.log(JSON.parse(localStorage.getItem('productStocks')));
console.log(JSON.parse(localStorage.getItem('stockYesterday')));
console.log(JSON.parse(localStorage.getItem('matieresPremieres')));
```

### Événements de Synchronisation
```javascript
// Écouter tous les événements :
window.addEventListener('productAdded', (e) => console.log('Produit ajouté:', e.detail));
window.addEventListener('productUpdated', (e) => console.log('Produit modifié:', e.detail));
window.addEventListener('productDeleted', (e) => console.log('Produit supprimé:', e.detail));
```

## 🎉 Résultat Final

**🎯 OBJECTIF ATTEINT** : Le site est maintenant **100% cohérent** et **connecté** !

- ✅ Modifications sauvegardées instantanément
- ✅ Synchronisation automatique entre tous les tableaux
- ✅ Aucune perte de données
- ✅ Interface utilisateur moderne avec feedback
- ✅ Architecture extensible pour futures fonctionnalités

**🚀 Votre site est maintenant un système unifié et robuste !**