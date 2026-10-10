# 🍔 Burger Social Club

Application de gestion pour restaurant de burgers avec interface moderne et API backend.

## 🚀 Démarrage Rapide

### Démarrage Automatique (Recommandé)

Double-cliquez sur `demarrer.bat` à la racine du projet.

### Démarrage Manuel

#### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📍 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentation API**: http://localhost:8000/docs

## 🏗️ Structure

- `frontend/` - Application Next.js avec TypeScript
- `backend/` - API FastAPI avec SQLite
- `database/` - Données et configuration
- `tests/` - Tests Playwright

## 📊 Fonctionnalités

- ✅ Gestion du stock avec seuils
- ✅ Gestion du menu et recettes
- ✅ Analyses et rapports
- ✅ Synchronisation temps réel
- ✅ Interface responsive

## 🛠️ Technologies

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Tests**: Playwright
- **Charts**: Chart.js, Recharts
- **Quantité en stock**
- **Prix de vente**
- **Liste des matières premières** (Recette/BOM)
- **Temps de production** (facultatif)
- **Catégorie** avec filtrage

### 📊 Fonctionnalités Avancées

#### 🔁 Approvisionnement

- Interface pour ajouter des entrées de stock
- Mise à jour automatique des quantités
- Gestion des fournisseurs

#### 📤 Consommation/Déstockage

- Décrémenter les MP selon leur recette
- Incrémenter les PF si c'est une production
- Décrémenter les PF si c'est une vente

#### ⏳ Suivi des Seuils

- Avertissement visuel si une MP descend en-dessous du seuil
- Affichage en rouge/alerte pour les stocks faibles
- Compteur de produits en rupture

#### 📆 Gestion des Dates

- Lister les produits proches de la date de péremption
- Tri des lots par date (FIFO)

### 🎨 Interface Moderne

- **Cards CSS** : Chaque produit fini dans une card moderne
- **Chart.js** : Graphiques pour visualiser les données
- **Responsive** : Interface adaptée mobile/desktop
- **Animations** : Transitions fluides et effets hover
- **Couleurs** : Code couleur cohérent (rouge=alerte, vert=OK, etc.)

## 🚀 Workflow Exemple

1. **Ajout de matières premières** : 50 kg de farine → stock mis à jour
2. **Production** : 10 Burgers Classic → consomme 2 kg de farine
3. **Stock mis à jour** : Farine passe à 48 kg
4. **Vente** : 5 Burgers Classic → stock PF passe de 10 à 5

## 📁 Structure des Fichiers

```
frontend/
├── components/
│   ├── MatierePremiereManager.tsx  # Gestion MP avec persistance
│   ├── MenuManager.tsx             # Gestion Menu avec cards
│   └── Navbar.tsx                  # Navigation
├── types/
│   └── dashboard.ts                # Interfaces TypeScript
├── pages/
│   └── dashboard.tsx               # Dashboard principal
└── package.json
```

## 🛠️ Technologies Utilisées

- **React/Next.js** : Framework frontend
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling moderne
- **Chart.js** : Graphiques interactifs
- **localStorage** : Persistance des données
- **React Toastify** : Notifications

## 🎯 Fonctionnalités Clés

### ✅ Implémentées

- [x] Persistance locale des données
- [x] Édition en ligne (clic pour modifier)
- [x] Gestion complète des matières premières
- [x] Gestion du menu avec cards CSS
- [x] Graphiques Chart.js
- [x] Alertes de stock faible
- [x] Recherche et filtrage
- [x] Interface responsive

### 🔄 Workflow de Production

- [x] Ajout de matières premières
- [x] Production de produits finis
- [x] Consommation automatique des MP
- [x] Suivi des stocks en temps réel
- [x] Alertes de réapprovisionnement

## 🎨 Design System

### Couleurs

- **Bleu** : Stock/Gestion
- **Vert** : Menu/Produits
- **Violet** : Matières Premières
- **Rouge** : Alertes/Ruptures
- **Orange** : Burgers
- **Rose** : Desserts

### Icons

- 📦 Stock
- 🍽️ Menu
- 🧪 Matières Premières
- ✅ Disponible
- ⚠️ Alerte
- 🗑️ Supprimer
- ✏️ Modifier

## 📱 Responsive Design

- **Mobile** : Cards empilées, navigation simplifiée
- **Tablet** : Layout adaptatif
- **Desktop** : Interface complète avec graphiques

## 🔧 Installation

```bash
cd frontend
npm install
npm run dev
```

## 🚀 Démarrage Rapide

1. Ouvrez le dashboard
2. Cliquez sur "Matières Premières"
3. Ajoutez quelques ingrédients
4. Passez au "Menu" pour créer des produits
5. Testez l'édition en ligne en cliquant sur les champs
6. Rafraîchissez la page pour voir la persistance

## 📈 Statistiques Disponibles

- **Total matières premières** : Nombre d'ingrédients
- **Valeur stock** : Valeur totale du stock
- **Stock faible** : Nombre de produits en alerte
- **Produits par catégorie** : Graphique Chart.js
- **COGS** : Coût des marchandises vendues

## 🎯 Prochaines Étapes

- [ ] Intégration avec API backend
- [ ] Synchronisation multi-appareils
- [ ] Export PDF des rapports
- [ ] Notifications push
- [ ] Mode sombre
- [ ] Historique des mouvements
