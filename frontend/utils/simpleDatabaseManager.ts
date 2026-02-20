// Gestionnaire simple pour lire la base de données d'ingrédients
export interface SimpleIngredient {
  id: number;
  nom: string;
  category: string;
  unite: string;
  prix_unitaire: number;
  quantite: number;
  emoji: string;
  description: string;
}

export interface SimpleDatabase {
  ingredients: SimpleIngredient[];
  categories: string[];
}

// Base de données par défaut si le fichier n'est pas accessible
const DEFAULT_DATABASE: SimpleDatabase = {
  ingredients: [
    {
      id: 1,
      nom: "Pain Burger",
      category: "Pains",
      unite: "unité",
      prix_unitaire: 0.5,
      quantite: 0,
      emoji: "🍞",
      description: "Pain pour burger"
    }
  ],
  categories: [
    "Pains",
    "Viandes", 
    "Légumes",
    "Fromages",
    "Sauces",
    "Boissons",
    "Accompagnements",
    "Épices",
    "Divers"
  ]
};

export class SimpleDatabaseManager {
  
  // Charger la base de données (pour l'instant, on utilise la base par défaut)
  static getDatabase(): SimpleDatabase {
    // TODO: Implémenter la lecture du fichier JSON
    // Pour l'instant, on retourne la base par défaut
    return DEFAULT_DATABASE;
  }

  // Obtenir toutes les catégories
  static getCategories(): string[] {
    return this.getDatabase().categories;
  }

  // Obtenir tous les ingrédients
  static getAllIngredients(): SimpleIngredient[] {
    return this.getDatabase().ingredients;
  }

  // Obtenir les ingrédients par catégorie
  static getIngredientsByCategory(category: string): SimpleIngredient[] {
    return this.getAllIngredients().filter(ing => ing.category === category);
  }

  // Rechercher des ingrédients
  static searchIngredients(searchTerm: string): SimpleIngredient[] {
    const term = searchTerm.toLowerCase();
    return this.getAllIngredients().filter(ing => 
      ing.nom.toLowerCase().includes(term) ||
      ing.description.toLowerCase().includes(term) ||
      ing.category.toLowerCase().includes(term)
    );
  }
}