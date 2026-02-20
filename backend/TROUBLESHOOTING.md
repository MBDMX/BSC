# 🔧 Guide de Dépannage - Ajout/Suppression de Produits

## 🚨 Problèmes Courants

### 1. **Erreur 401 (Unauthorized)**
**Symptômes :** 
- Messages d'erreur "401 Unauthorized" dans la console
- Impossible d'ajouter/supprimer des produits

**Solutions :**
1. Vérifiez que vous êtes connecté en tant qu'admin (`dymeh` / `admin`)
2. Vérifiez que le token JWT est valide dans localStorage
3. Redémarrez le backend et le frontend

### 2. **Erreur 403 (Forbidden)**
**Symptômes :**
- Messages "Accès refusé - Admin requis"
- Fonctionnalités bloquées

**Solutions :**
1. Connectez-vous avec le compte admin : `dymeh` / `admin`
2. Vérifiez que le rôle est bien "admin" dans le token

### 3. **Erreur de Connexion au Backend**
**Symptômes :**
- Erreurs "Failed to fetch" dans la console
- Impossible de charger les données

**Solutions :**
1. Vérifiez que le backend tourne sur `http://localhost:8000`
2. Lancez le backend : `cd backend && python -m uvicorn app.main:app --reload`
3. Vérifiez les logs du backend

## 🧪 Tests de Diagnostic

### Test 1 : Vérifier le Backend
```bash
cd backend
python test_api.py
```

### Test 2 : Vérifier les Routes
Ouvrez votre navigateur et testez :
- `http://localhost:8000/debug/products` (devrait afficher les produits)
- `http://localhost:8000/docs` (documentation FastAPI)

### Test 3 : Vérifier l'Authentification
1. Ouvrez la console du navigateur (F12)
2. Tapez : `localStorage.getItem("access_token")`
3. Vérifiez que le token existe et n'est pas expiré

## 🔍 Logs de Debug

### Dans le Frontend (Console navigateur)
Les nouvelles fonctions ajoutent des logs détaillés :
- `console.log("Envoi des données:", nouveauProduit)`
- `console.log("Réponse du serveur:", response.status)`
- `console.log("Produit ajouté avec succès:", result)`

### Dans le Backend (Terminal)
Le backend affiche des logs :
- `print(f"Produit ajouté: {new_product.dict()}")`
- `print(f"Produit supprimé avec ID: {product_id}")`

## 🛠️ Solutions Rapides

### Redémarrage Complet
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Nettoyage du Cache
1. Videz le localStorage : `localStorage.clear()`
2. Reconnectez-vous avec `dymeh` / `admin`

### Vérification des Données
1. Allez sur `http://localhost:8000/debug/products`
2. Vérifiez que les produits s'affichent
3. Testez l'ajout via cette route

## 📋 Checklist de Vérification

- [ ] Backend démarré sur port 8000
- [ ] Frontend démarré sur port 3000
- [ ] Connecté en tant qu'admin (`dymeh` / `admin`)
- [ ] Token JWT valide dans localStorage
- [ ] Pas d'erreurs CORS
- [ ] Console du navigateur sans erreurs
- [ ] Routes API accessibles

## 🆘 Si Rien Ne Fonctionne

1. **Vérifiez les logs** dans la console du navigateur
2. **Vérifiez les logs** du backend dans le terminal
3. **Testez l'API** avec `python test_api.py`
4. **Redémarrez** tout le système
5. **Vérifiez** que tous les fichiers sont à jour

## 📞 Support

Si le problème persiste, fournissez :
1. Les logs de la console du navigateur
2. Les logs du backend
3. Le résultat de `python test_api.py`
4. La version de Python et Node.js utilisée 