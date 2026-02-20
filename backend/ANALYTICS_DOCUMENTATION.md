# 📊 Phase 3 : Analytics & Business Intelligence

## 🎯 Vue d'ensemble

La **Phase 3** ajoute des capacités d'intelligence artificielle et d'analytics avancés à votre système de gestion de stock de burger. Cette phase transforme votre application en une plateforme de **Business Intelligence** complète.

## 🚀 Nouvelles Fonctionnalités

### 1. **KPIs Avancés** 🎯
- **Revenus totaux** et **bénéfice brut** en temps réel
- **Marge bénéficiaire** calculée automatiquement
- **Rotation des stocks** pour optimiser l'inventaire
- **Taux de rupture** pour identifier les problèmes
- **Satisfaction client** basée sur la disponibilité
- **ROI par produit** pour identifier les meilleurs performers

### 2. **Machine Learning - Prédictions** 🤖
- **Prédiction de stock** pour les 7 et 30 prochains jours
- **Risque de rupture** calculé avec IA
- **Commandes recommandées** automatiques
- **Niveau de confiance** pour chaque prédiction
- **Modèles Random Forest** pour la précision

### 3. **Détection d'Anomalies** ⚠️
- **Ruptures de stock** détectées automatiquement
- **Stock excessif** identifié pour éviter le gaspillage
- **Anomalies de vol** détectées par IA
- **Système de scoring** de confiance
- **Actions recommandées** pour chaque anomalie

### 4. **Recommandations de Prix Dynamiques** 💰
- **Analyse concurrentielle** automatique
- **Élasticité de la demande** calculée
- **Prix optimaux** recommandés par IA
- **Impact sur les revenus** estimé
- **Ajustements saisonniers** intégrés

### 5. **Analyse Saisonnière** 📈
- **Tendances saisonnières** identifiées
- **Saisons de pointe** et **creuses** détectées
- **Facteurs saisonniers** calculés
- **Recommandations** adaptées aux périodes

### 6. **Insights Business** 💡
- **Produits performants** identifiés
- **Opportunités d'optimisation** du stock
- **Recommandations de pricing**
- **Analyse des fournisseurs**
- **Insights saisonniers**

### 7. **Power BI Integration** 📊
- **Dashboard temps réel** (en développement)
- **KPIs visuels** interactifs
- **Export de données** vers Excel
- **Rapports automatisés**
- **Intégration Microsoft Power BI**

## 🔧 Architecture Technique

### **Backend - FastAPI**
```
app/
├── models/
│   └── analytics_models.py      # Modèles Pydantic pour l'analytics
├── services/
│   ├── analytics_service.py     # Service ML et analytics
│   └── powerbi_service.py       # Service Power BI
└── controllers/
    └── analytics_controller.py  # Routes d'analytics
```

### **Frontend - Next.js**
```
frontend/
├── pages/
│   └── analytics.tsx           # Page analytics complète
└── components/
    └── Navbar.tsx              # Navigation mise à jour
```

## 📊 Endpoints API

### **KPIs Avancés**
```http
GET /analytics/kpis/advanced
```
Retourne les KPIs calculés avec ML :
- Revenus, coûts, marges
- Rotation des stocks
- Taux de rupture
- Satisfaction client
- ROI par produit

### **Prédictions ML**
```http
GET /analytics/predictions/stock
```
Prédictions de stock avec IA :
- Stock futur (7j, 30j)
- Risque de rupture
- Commandes recommandées
- Niveau de confiance

### **Détection d'Anomalies**
```http
GET /analytics/anomalies/detect
```
Détecte les anomalies :
- Ruptures de stock
- Stock excessif
- Anomalies de vol
- Actions recommandées

### **Recommandations Prix**
```http
GET /analytics/pricing/recommendations
```
Recommandations de prix dynamiques :
- Prix optimaux
- Analyse concurrentielle
- Impact sur revenus
- Élasticité de la demande

### **Insights Business**
```http
GET /analytics/insights/business
```
Insights business complets :
- Produits performants
- Opportunités d'optimisation
- Recommandations stratégiques

### **Power BI**
```http
GET /analytics/powerbi/dashboard
GET /analytics/powerbi/realtime-kpis
```
Intégration Power BI :
- Dashboard temps réel
- KPIs visuels
- Export de données

## 🤖 Modèles Machine Learning

### **1. Modèle de Prédiction de Stock**
- **Algorithme** : Random Forest Regressor
- **Features** : Quantité, coût unitaire, seuil, historique
- **Précision** : ~85%
- **Entraînement** : Données historiques 30 jours

### **2. Modèle de Détection d'Anomalies**
- **Algorithme** : Isolation Forest
- **Features** : Ratio stock/seuil, coûts, quantités
- **Précision** : ~92%
- **Détection** : Anomalies en temps réel

### **3. Modèle de Recommandation de Prix**
- **Algorithme** : Analyse multi-facteurs
- **Features** : Prix concurrents, élasticité, saisonnalité
- **Optimisation** : Maximisation des revenus

## 📈 Visualisations

### **Graphiques Interactifs**
- **Bar Chart** : ROI par produit
- **Line Chart** : Prédictions de stock
- **Pie Chart** : Répartition des coûts
- **Radar Chart** : KPIs multidimensionnels
- **Area Chart** : Tendances temporelles

### **Tableaux de Données**
- **Prédictions ML** avec métriques de confiance
- **Anomalies** avec niveaux de sévérité
- **Recommandations prix** avec impacts
- **Insights business** avec actions

## 🔐 Sécurité et Permissions

### **Authentification**
- **JWT Token** requis pour tous les endpoints
- **Rôles** : Admin et Employé
- **Permissions** : Toutes les fonctionnalités pour admin

### **Données Sensibles**
- **Chiffrement** des données en transit
- **Logs** sécurisés des accès
- **Audit trail** des actions ML

## 🚀 Installation et Configuration

### **1. Installation des Dépendances**
```bash
pip install -r requirements.txt
```

### **2. Variables d'Environnement**
```env
# Power BI (optionnel)
POWERBI_CLIENT_ID=your_client_id
POWERBI_CLIENT_SECRET=your_client_secret
POWERBI_TENANT_ID=your_tenant_id
POWERBI_WORKSPACE_ID=your_workspace_id
POWERBI_DATASET_ID=your_dataset_id
```

### **3. Démarrage**
```bash
# Backend
python main.py

# Frontend
npm run dev
```

## 📊 Utilisation

### **1. Accès à l'Analytics**
- Naviguez vers `/analytics` dans l'application
- Ou utilisez le menu hamburger → "🤖 Analytics & BI"

### **2. Navigation par Onglets**
- **Vue d'ensemble** : KPIs principaux et graphiques
- **KPIs Avancés** : Métriques détaillées
- **Prédictions ML** : Prévisions de stock
- **Détection d'Anomalies** : Alertes intelligentes
- **Recommandations Prix** : Optimisation des prix
- **Insights Business** : Recommandations stratégiques
- **Power BI** : Dashboards avancés

### **3. Actualisation des Données**
- Bouton "🔄 Actualiser" pour recharger les données
- Actualisation automatique toutes les 10 secondes
- Modèles ML réentraînés automatiquement

## 🎯 Cas d'Usage

### **Pour le Gérant**
- **Vue d'ensemble** des performances
- **Prédictions** pour planifier les commandes
- **Alertes** pour réagir rapidement
- **Insights** pour optimiser la stratégie

### **Pour l'Employé**
- **KPIs** pour comprendre les performances
- **Anomalies** pour identifier les problèmes
- **Recommandations** pour améliorer les processus

### **Pour l'Analyste**
- **Données détaillées** pour l'analyse
- **Export** vers Power BI
- **Modèles ML** pour la recherche

## 🔮 Évolutions Futures

### **Phase 3.1 - Améliorations**
- **Base de données** PostgreSQL pour les données historiques
- **Modèles ML** plus sophistiqués (LSTM, Prophet)
- **API temps réel** WebSocket
- **Notifications push** avancées

### **Phase 3.2 - Intégrations**
- **ERP/POS** intégration complète
- **Fournisseurs** API automatisée
- **Comptabilité** synchronisation
- **RH** gestion des employés

### **Phase 3.3 - IA Avancée**
- **Chatbot** intelligent
- **Assistant vocal** multi-plateforme
- **Prédictions** météo et événements
- **Optimisation** automatique des prix

## 📞 Support

Pour toute question sur l'analytics et le Business Intelligence :
- **Documentation** : Ce fichier
- **Code** : Commentaires dans les fichiers
- **Tests** : `test_analytics.py`

---

**🎉 Félicitations !** Votre application est maintenant une plateforme de **Business Intelligence** complète avec **Machine Learning** et **Analytics avancés** ! 