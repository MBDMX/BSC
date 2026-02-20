// Interfaces pour la gestion des stocks
export interface StockIngredient {
  id: number;
  nom: string;
  code: string;
  unite: string;
  quantite_stock: number;
  seuil_reapprovisionnement: number;
  prix_achat: number;
  fournisseur: string;
  date_peremption?: string;
  categorie?: string;
  created_at: string;
  updated_at?: string;
}

export interface StockMovement {
  type: 'entree' | 'sortie';
  quantite: number;
  raison?: string;
  date_mouvement?: string;
}

export interface StockAlert {
  ingredient_id: number;
  ingredient_nom: string;
  stock_actuel: number;
  seuil_alerte: number;
  unite: string;
  niveau_urgence: 'critique' | 'attention';
}

export interface StockStatistics {
  total_ingredients: number;
  total_stock_value: number;
  avg_value_per_ingredient: number;
  low_stock_count: number;
  most_expensive: Array<{
    id: number;
    nom: string;
    prix_unitaire: number;
    stock: number;
    unite: string;
  }>;
  highest_stock: Array<{
    id: number;
    nom: string;
    stock: number;
    unite: string;
    prix_unitaire: number;
  }>;
}

// Interfaces pour le Menu
export interface MenuIngredient {
  ingredient_id: number;
  quantite: number;
  ingredient: {
    id: number;
    nom: string;
    unite: string;
    quantite_stock: number;
    prix_unitaire: number;
  };
}

export interface MenuRecette {
  id: number;
  instructions: string;
  temps_preparation: number;
  difficulte: string;
  ingredients: MenuIngredient[];
}

export interface MenuProduit {
  id: number;
  nom: string;
  reference: string;
  description: string;
  prix: number;
  quantite_stock: number;
  categorie_id: number;
  disponible: string;
  temps_production?: number;
  categorie?: {
    id: number;
    nom: string;
    description: string;
  };
  recette?: MenuRecette;
}

export interface MenuCategorie {
  id: number;
  nom: string;
  description: string;
}

// Interface pour l'édition en ligne
export interface EditingState {
  [key: number]: {
    field: string;
    value: any;
  };
}
