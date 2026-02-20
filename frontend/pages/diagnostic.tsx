import { useState, useEffect } from 'react';
import { IngredientsManager } from '../utils/ingredientsManager';
import { GlobalDataManager } from '../utils/globalDataManager';

export default function Diagnostic() {
  const [diagnosticData, setDiagnosticData] = useState({
    ingredients: [],
    localStorage: [],
    menuItems: [],
    sales: []
  });

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = () => {
    // Vérifier les ingrédients
    const ingredients = IngredientsManager.getCurrentIngredients();
    
    // Vérifier tout le localStorage
    const localStorageData = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          localStorageData.push({
            key,
            value: value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : null,
            size: value ? value.length : 0
          });
        } catch (e) {
          localStorageData.push({
            key,
            value: 'Erreur de lecture',
            size: 0
          });
        }
      }
    }

    // Vérifier les éléments du menu
    let menuItems = [];
    try {
      const menuData = localStorage.getItem('menu-items');
      if (menuData) {
        menuItems = JSON.parse(menuData);
      }
    } catch (e) {
      console.error('Erreur lecture menu:', e);
    }

    // Vérifier les ventes
    let sales = [];
    try {
      const salesData = localStorage.getItem('synchronized-sales');
      if (salesData) {
        sales = JSON.parse(salesData);
      }
    } catch (e) {
      console.error('Erreur lecture ventes:', e);
    }

    setDiagnosticData({
      ingredients,
      localStorage: localStorageData,
      menuItems,
      sales
    });
  };

  const performFullReset = async () => {
    if (window.confirm('⚠️ ATTENTION ⚠️\n\nCela va supprimer TOUTES les données !\n\nÊtes-vous sûr ?')) {
      try {
        await GlobalDataManager.performFullReset();
      } catch (error) {
        console.error('Erreur reset:', error);
        // Fallback: nettoyage manuel
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const clearSpecificKey = (key: string) => {
    if (window.confirm(`Supprimer la clé "${key}" ?`)) {
      localStorage.removeItem(key);
      runDiagnostic();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            background: 'linear-gradient(135deg, #03224c 0%, #FFB6C1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '1rem'
          }}>
            🔍 Diagnostic Application
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={runDiagnostic}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              🔄 Actualiser Diagnostic
            </button>
            
            <button
              onClick={performFullReset}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              🗑️ RESET COMPLET
            </button>

            <a 
              href="/login"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-block'
              }}
            >
              ← Retour à l'app
            </a>
          </div>
        </div>

        {/* Ingrédients Actuels */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#03224c', marginBottom: '1rem' }}>
            📦 Ingrédients Actuels ({diagnosticData.ingredients.length})
          </h2>
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '8px', 
            padding: '1rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {diagnosticData.ingredients.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucun ingrédient trouvé</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
                {diagnosticData.ingredients.map((ing: any, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    <strong>{ing.nom}</strong> - {ing.quantite} {ing.unite} - {ing.prix_unitaire} TND
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Éléments Menu */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#03224c', marginBottom: '1rem' }}>
            🍽️ Éléments Menu ({diagnosticData.menuItems.length})
          </h2>
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '8px', 
            padding: '1rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {diagnosticData.menuItems.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucun élément de menu trouvé</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
                {diagnosticData.menuItems.map((item: any, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    <strong>{item.nom}</strong> - {item.prix} TND
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ventes */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#03224c', marginBottom: '1rem' }}>
            🛒 Ventes ({diagnosticData.sales.length})
          </h2>
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '8px', 
            padding: '1rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {diagnosticData.sales.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucune vente trouvée</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
                {diagnosticData.sales.slice(0, 10).map((sale: any, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    <strong>{sale.produit_nom}</strong> - {sale.quantite} x {sale.prix_unitaire} TND ({sale.date})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenu LocalStorage */}
        <div>
          <h2 style={{ color: '#03224c', marginBottom: '1rem' }}>
            💾 Contenu LocalStorage ({diagnosticData.localStorage.length} clés)
          </h2>
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '8px', 
            padding: '1rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {diagnosticData.localStorage.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>LocalStorage vide</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {diagnosticData.localStorage.map((item, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#03224c' }}>{item.key}</strong>
                      <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {item.value} ({item.size} caractères)
                      </div>
                    </div>
                    <button
                      onClick={() => clearSpecificKey(item.key)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fff3cd',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#856404',
          textAlign: 'center'
        }}>
          💡 <strong>Instructions :</strong><br/>
          1. Vérifiez les données ci-dessus<br/>
          2. Si vous voyez des données fantômes (ZARA, arta, etc.), utilisez "RESET COMPLET"<br/>
          3. Le reset supprimera tout et rechargera avec les données par défaut
        </div>
      </div>
    </div>
  );
}