import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import StockSynchronizer from '../components/StockSynchronizer';

type StockItem = {
  id: number;
  name: string;
  unitCost: number;
};

type Ingredient = {
  item_id: number;
  quantity: number;
};

export default function BurgerPrice() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tva, setTva] = useState(0.19);
  const [remise, setRemise] = useState(0);
  const [marge, setMarge] = useState(0.2);
  const [result, setResult] = useState<{
    cost_ht: number;
    price_ttc: number;
    marge_realisee: number;
  } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  // 1. Récupérer les produits du stock réel
  useEffect(() => {
    fetch("http://localhost:8000/dashboard-data", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const produits = Array.isArray(data.products) ? data.products : [];
        setStockItems(produits.map((p: any) => ({
          id: p.id,
          name: p.nom,
          unitCost: p.cout_unitaire,
        })));
        if (produits.length > 0) {
          setIngredients([{ item_id: produits[0].id, quantity: 1 }]);
        }
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des produits:", error);
      });
  }, []);

  // 2. Permettre d'ajouter/supprimer/modifier quantité
  // 3. Calculer le prix détaillé
  // 4. Afficher le détail du calcul et les contrôles pour marge, remise, TVA
  // Supprimer le useEffect qui calcule automatiquement
  // useEffect(() => {
  //   if (ingredients.length === 0 || stockItems.length === 0) return;
  //   calculate();
  // }, [ingredients, tva, remise, marge]);

  const addIngredient = () => {
    if (stockItems.length === 0) return;
    setIngredients([...ingredients, { item_id: stockItems[0].id, quantity: 1 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: number
  ) => {
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Conversion des pourcentages en décimal pour le calcul
  const tvaDecimal = tva / 100;
  const remiseDecimal = remise / 100;
  const margeDecimal = marge / 100;

  const calculate = async () => {
    try {
      const res = await fetch("http://localhost:8000/price-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredients, tva: tvaDecimal, remise: remiseDecimal, marge: margeDecimal }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Erreur de calcul", error);
    }
  };

  return (
    <ProtectedRoute>
      <StockSynchronizer />
      <Navbar />
      <div className="burger-price-container bg-gray-50 min-h-screen">
        <div className="burger-price-header px-2 sm:px-4 md:px-8">
          <div className="max-w-screen-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">🧮 Estimation du prix d’un Burger</h1>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto mb-8 px-2 sm:px-4 md:px-8">
          <div className="burger-price-content">
            <div className="section">
              <h2 className="text-2xl font-semibold mb-4">Ingrédients</h2>

              {stockItems.length === 0 ? (
                <p className="text-lg">Aucun ingrédient disponible dans le stock. Veuillez ajouter des ingrédients dans le dashboard.</p>
              ) : (
                <div className="overflow-x-auto">
                  {ingredients.map((ing, i) => {
                    const product = stockItems.find((p) => p.id === ing.item_id);
                    return (
                      <div key={i} className="ingredient-row">
                        <select
                          value={ing.item_id}
                          onChange={(e) => updateIngredient(i, "item_id", +e.target.value)}
                        >
                          {stockItems.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Quantité"
                          value={ing.quantity}
                          onChange={(e) =>
                            updateIngredient(i, "quantity", +e.target.value)
                          }
                        />

                        <span className="unit-cost">
                          {product ? `${product.unitCost.toFixed(2)} DT/u` : "-"}
                        </span>

                        <button onClick={() => removeIngredient(i)}>🗑️</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="btn-secondary" onClick={addIngredient}>
                ➕ Ajouter un ingrédient
              </button>
            </div>

            <div className="section-inputs">
              <label className="text-lg">
                TVA (%)
                <input
                  type="number"
                  step="0.01"
                  value={tva}
                  onChange={(e) => setTva(+e.target.value)}
                />
              </label>
              <label className="text-lg">
                Remise (%)
                <input
                  type="number"
                  step="0.01"
                  value={remise}
                  onChange={(e) => setRemise(+e.target.value)}
                />
              </label>
              <label className="text-lg">
                Marge souhaitée (%)
                <input
                  type="number"
                  step="0.01"
                  value={marge}
                  onChange={(e) => setMarge(+e.target.value)}
                />
              </label>
            </div>
            <button
              className="btn-primary"
              style={{ marginTop: 20, width: "100%" }}
              onClick={calculate}
              disabled={ingredients.length === 0 || stockItems.length === 0}
            >
              Estimer le prix
            </button>
          </div>
        </div>

        {result && (
          <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-8">
            <div className="section result">
              <h2 className="text-2xl font-semibold mb-4">💰 Résultat</h2>
              <p className="text-lg">
                <strong>Coût HT :</strong> {typeof result.cost_ht === 'number' ? result.cost_ht.toFixed(2) : '-'} DT
              </p>
              <p className="text-lg">
                <strong>Prix TTC estimé :</strong> {typeof result.price_ttc === 'number' ? result.price_ttc.toFixed(2) : '-'} DT
              </p>
              <p className="text-lg">
                <strong>Marge réalisée :</strong> {typeof result.marge_realisee === 'number' ? (result.marge_realisee * 100).toFixed(2) : '-'} %
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .burger-price-container {
          padding-top: 80px; /* Adjust for Navbar height */
        }

        .burger-price-header {
          padding-top: 20px;
          padding-bottom: 20px;
        }

        .burger-price-header h1 {
          text-align: center;
        }

        .burger-price-content {
          padding: 20px;
        }

        .section {
          background: white;
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 0 10px #ccc;
        }

        .ingredient-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        select,
        input {
          padding: 8px;
          font-size: 14px;
        }

        .unit-cost {
          font-weight: bold;
          margin-right: 10px;
        }

        .btn-primary,
        .btn-secondary {
          background: #673ab7;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
        }

        .btn-secondary {
          background: #9c27b0;
        }

        .section-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 20px;
        }

        .section-inputs label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .ingredient-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .section-inputs {
            flex-direction: column;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
