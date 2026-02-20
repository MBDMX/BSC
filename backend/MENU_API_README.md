# 🍔 API Menu Burger - Documentation

## Vue d'ensemble

Cette API permet de gérer complètement votre menu de restaurant avec :
- **Catégories** de produits (Burgers, Boissons, Desserts, etc.)
- **Produits** avec références, prix et descriptions
- **Ingrédients** avec stock et prix unitaires
- **Recettes** détaillées avec quantités d'ingrédients
- **Calculs automatiques** de coûts et vérification de stock

## 🚀 Installation et démarrage

### 1. Initialiser la base de données
```bash
cd backend
python -m app.db.init_db
```

### 2. Démarrer l'API
```bash
cd backend
uvicorn main:app --reload
```

### 3. Tester l'API
```bash
python test_menu_api.py
```

## 📊 Structure de la base de données

### Tables principales :
- **`categories`** : Catégories de produits
- **`produits`** : Produits du menu avec références
- **`ingredients`** : Stock d'ingrédients disponibles
- **`recettes`** : Recettes des produits
- **`recette_ingredients`** : Quantités d'ingrédients par recette

## 🔗 Endpoints disponibles

### Catégories
```
GET    /menu/categories/          # Liste toutes les catégories
POST   /menu/categories/          # Créer une catégorie
GET    /menu/categories/{id}      # Récupérer une catégorie
PUT    /menu/categories/{id}      # Modifier une catégorie
DELETE /menu/categories/{id}      # Supprimer une catégorie
```

### Produits
```
GET    /menu/produits/                    # Liste tous les produits
POST   /menu/produits/                    # Créer un produit avec recette
GET    /menu/produits/{id}                # Récupérer un produit
GET    /menu/produits/reference/{ref}     # Produit par référence
GET    /menu/produits/categorie/{id}      # Produits d'une catégorie
PUT    /menu/produits/{id}                # Modifier un produit
DELETE /menu/produits/{id}                # Supprimer un produit
```

### Ingrédients
```
GET    /menu/ingredients/         # Liste tous les ingrédients
POST   /menu/ingredients/         # Créer un ingrédient
GET    /menu/ingredients/{id}     # Récupérer un ingrédient
PUT    /menu/ingredients/{id}     # Modifier un ingrédient
DELETE /menu/ingredients/{id}     # Supprimer un ingrédient
```

### Recettes
```
GET    /menu/produits/{id}/recette        # Recette d'un produit
POST   /menu/produits/{id}/recette        # Créer une recette
PUT    /menu/recettes/{id}                # Modifier une recette
```

### Utilitaires
```
GET    /menu/complet                      # Menu complet avec relations
GET    /menu/recettes/{id}/cout           # Calculer le coût d'une recette
GET    /menu/recettes/{id}/stock          # Vérifier le stock d'une recette
```

## 📝 Exemples d'utilisation

### 1. Créer un nouveau produit avec recette
```json
POST /menu/produits/
{
  "nom": "Burger Végétarien",
  "reference": "BURG-VEG-001",
  "description": "Burger végétarien avec galette de légumes",
  "prix": 9.50,
  "categorie_id": 1,
  "recette": {
    "instructions": "1. Préparer la galette de légumes\n2. Faire griller le pain\n3. Assembler avec salade et sauce",
    "temps_preparation": 12,
    "difficulte": "moyen",
    "ingredients": [
      {"ingredient_id": 1, "quantite": 1},
      {"ingredient_id": 3, "quantite": 0.02},
      {"ingredient_id": 4, "quantite": 0.03}
    ]
  }
}
```

### 2. Ajouter un nouvel ingrédient
```json
POST /menu/ingredients/
{
  "nom": "Galette de légumes",
  "unite": "unité",
  "stock_disponible": 50,
  "prix_unitaire": 2.50
}
```

### 3. Vérifier le coût d'une recette
```
GET /menu/recettes/1/cout
```
Réponse :
```json
{
  "recette_id": 1,
  "cout_total": 3.45
}
```

### 4. Vérifier la disponibilité des ingrédients
```
GET /menu/recettes/1/stock
```
Réponse :
```json
{
  "disponible": true,
  "ingredients_manquants": []
}
```

## 🎯 Fonctionnalités clés

### ✅ Gestion complète du menu
- Création et modification de produits
- Gestion des catégories
- Système de références unique

### ✅ Gestion des recettes
- Recettes détaillées avec instructions
- Quantités précises d'ingrédients
- Calcul automatique des coûts

### ✅ Gestion du stock
- Suivi des ingrédients disponibles
- Vérification automatique de stock
- Alertes d'ingrédients manquants

### ✅ API REST complète
- Endpoints CRUD pour toutes les entités
- Validation des données avec Pydantic
- Documentation automatique (Swagger)

## 🔧 Configuration

### Base de données
- **Type** : SQLite (fichier `burger_menu.db`)
- **Localisation** : `backend/burger_menu.db`
- **ORM** : SQLAlchemy

### Variables d'environnement
```bash
# Optionnel - pour changer la base de données
DATABASE_URL=sqlite:///./burger_menu.db
```

## 📚 Documentation interactive

Une fois l'API démarrée, accédez à :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 🧪 Tests

### Test automatique
```bash
python test_menu_api.py
```

### Test manuel avec curl
```bash
# Récupérer le menu complet
curl http://localhost:8000/menu/complet

# Créer une catégorie
curl -X POST http://localhost:8000/menu/categories/ \
  -H "Content-Type: application/json" \
  -d '{"nom": "Nouvelle Catégorie", "description": "Description"}'
```

## 🚨 Dépannage

### Erreur de connexion à la base de données
```bash
# Réinitialiser la base de données
rm backend/burger_menu.db
python -m app.db.init_db
```

### Erreur d'import
```bash
# Vérifier les dépendances
pip install -r requirements.txt
```

### Port déjà utilisé
```bash
# Changer le port
uvicorn main:app --reload --port 8001
```

## 📈 Prochaines étapes

1. **Interface utilisateur** : Créer un frontend pour gérer le menu
2. **Gestion des commandes** : Intégrer avec le système de commandes
3. **Alertes automatiques** : Notifications quand le stock est bas
4. **Rapports** : Génération de rapports de coûts et de rentabilité
5. **Multi-restaurants** : Support pour plusieurs établissements

---

**🎉 Votre base de données de menu est maintenant prête !** 

Vous pouvez commencer à ajouter vos produits, ingrédients et recettes via l'API ou l'interface de documentation. 