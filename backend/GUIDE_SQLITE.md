# 🍔 Guide SQLite pour votre projet Burger

## 📋 Qu'est-ce que SQLite ?

**SQLite** est une base de données légère et autonome qui stocke toutes les données dans un seul fichier. C'est parfait pour les projets comme le vôtre !

### ✅ Avantages de SQLite :
- **Pas d'installation** : Inclus avec Python
- **Fichier unique** : Tout dans `burger_menu.db`
- **Portable** : Copier le fichier = sauvegarder tout
- **Simple** : Pas de serveur à configurer

## 🗂️ Structure de votre base de données

```
burger_menu.db
├── categories (4 catégories)
├── ingredients (18 ingrédients)
├── produits (5 produits)
├── recettes (5 recettes)
└── recette_ingredients (quantités)
```

## 🛠️ Commandes utiles

### 1. Explorer le contenu
```bash
python explore_db_final.py
```
**Affiche** : Toutes les tables, données et statistiques

### 2. Sauvegarder la base
```bash
python backup_db.py
```
**Crée** : `backup_burger_menu_YYYYMMDD_HHMMSS.db`

### 3. Restaurer une sauvegarde
```bash
python backup_db.py restore backup_burger_menu_20250805_125838.db
```

### 4. Réinitialiser la base
```bash
python -m app.db.init_db
```

## 📊 Ce que contient votre base

### 🏷️ Catégories (4)
- Burgers
- Boissons  
- Desserts
- Accompagnements

### 🥬 Ingrédients (18)
- Pain à burger (100 unités, 0.5€)
- Steak de bœuf (50kg, 15€/kg)
- Fromage cheddar (20kg, 8€/kg)
- Et 15 autres...

### 🍔 Produits (5)
- Burger Classique (8.5€)
- Burger Bacon (10.5€)
- Frites Maison (4.5€)
- Coca-Cola (2.5€)
- Milkshake Chocolat (5.5€)

### 📝 Recettes détaillées
Chaque produit a sa recette avec quantités précises :
- **Burger Classique** : 1 pain + 0.15kg steak + 0.03kg fromage + etc.

## 🔧 Comment modifier la base

### Via l'API (recommandé)
```bash
# Démarrer le serveur
python main.py

# Puis utiliser les endpoints :
# POST /menu/categories/
# POST /menu/ingredients/
# POST /menu/produits/
```

### Via Python directement
```python
import sqlite3

# Connexion
conn = sqlite3.connect('burger_menu.db')
cursor = conn.cursor()

# Ajouter un ingrédient
cursor.execute("""
    INSERT INTO ingredients (nom, unite, stock_disponible, prix_unitaire)
    VALUES ('Nouvel ingrédient', 'kg', 10.0, 5.0)
""")

# Sauvegarder
conn.commit()
conn.close()
```

## 📁 Fichiers importants

| Fichier | Rôle |
|---------|------|
| `burger_menu.db` | **Base de données principale** |
| `backup_*.db` | **Sauvegardes automatiques** |
| `explore_db_final.py` | **Explorer le contenu** |
| `backup_db.py` | **Sauvegarder/Restaurer** |
| `app/db/init_db.py` | **Initialiser la base** |

## 🚨 Bonnes pratiques

### ✅ À faire
- **Sauvegarder régulièrement** : `python backup_db.py`
- **Tester avant modification** : `python explore_db_final.py`
- **Utiliser l'API** pour les modifications
- **Vérifier les données** après chaque changement

### ❌ À éviter
- **Modifier directement** le fichier `.db` avec un éditeur
- **Supprimer** `burger_menu.db` sans sauvegarde
- **Oublier de faire** `conn.commit()` après modifications
- **Travailler** sans sauvegarde récente

## 🔍 Dépannage

### Problème : "Base de données corrompue"
```bash
# Restaurer la dernière sauvegarde
python backup_db.py restore backup_burger_menu_YYYYMMDD_HHMMSS.db
```

### Problème : "Fichier introuvable"
```bash
# Réinitialiser la base
python -m app.db.init_db
```

### Problème : "Erreur de connexion"
```bash
# Vérifier que le fichier existe
dir burger_menu.db
```

## 📈 Prochaines étapes

1. **Tester l'API** : `python test_menu_api.py`
2. **Ajouter vos produits** via l'API
3. **Créer des sauvegardes** régulières
4. **Explorer les données** avec `explore_db_final.py`

## 💡 Conseils

- **Gardez toujours** une sauvegarde récente
- **Testez** avant de modifier en production
- **Documentez** vos changements
- **Utilisez l'API** plutôt que SQL direct

---

🎉 **Félicitations !** Vous maîtrisez maintenant SQLite pour votre projet burger ! 