import { useState } from 'react';
import { IngredientsManager } from '../utils/ingredientsManager';
import { GlobalDataManager } from '../utils/globalDataManager';
import { toast } from 'react-toastify';

export default function TestReset() {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (window.confirm('⚠️ ATTENTION ⚠️\n\nCela va supprimer TOUTES les données de l\'application !\n\nÊtes-vous sûr ?')) {
      setIsResetting(true);
      try {
        await GlobalDataManager.performFullReset();
        toast.success('🔄 Application réinitialisée avec succès !');
      } catch (error) {
        toast.error('Erreur lors de la réinitialisation');
        console.error(error);
        // Fallback
        localStorage.clear();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const showCurrentData = () => {
    const ingredients = IngredientsManager.getCurrentIngredients();
    const yesterday = IngredientsManager.getYesterdayIngredients();
    
    console.log('=== DONNÉES ACTUELLES ===');
    console.log('Ingrédients actuels:', ingredients);
    console.log('Ingrédients hier:', yesterday);
    console.log('========================');
    
    toast.info('📊 Données affichées dans la console');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '3rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          background: 'linear-gradient(135deg, #03224c 0%, #FFB6C1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem'
        }}>
          🔄 Test Reset App
        </h1>
        
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Page de test pour réinitialiser complètement l'application
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={showCurrentData}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}
          >
            📊 Afficher les données actuelles
          </button>
          
          <button
            onClick={handleReset}
            disabled={isResetting}
            style={{
              background: isResetting 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              cursor: isResetting ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}
          >
            {isResetting ? '🔄 Réinitialisation...' : '🗑️ RÉINITIALISER TOUT'}
          </button>

          <a 
            href="/ingredient-help"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            📚 Guide des Ingrédients
          </a>

          <a 
            href="/reset-with-selection"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            🛒 Réinitialiser avec Sélection
          </a>

          <a 
            href="/diagnostic"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            🔍 Diagnostic Complet
          </a>

          <a 
            href="/login"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            ← Retour à l'app
          </a>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fff3cd',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#856404'
        }}>
          ⚠️ La réinitialisation supprime :<br/>
          • Tous les ingrédients<br/>
          • Tous les plats du menu<br/>
          • Toutes les ventes<br/>
          • Tous les rapports
        </div>
      </div>
    </div>
  );
}