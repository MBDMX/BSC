// Gestionnaire de stock vide avec synchronisation automatique
export interface StockItem {
  id: string;
  nom: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  category?: string;
  emoji?: string;
  derniere_mise_a_jour: string;
}

const STOCK_KEY = 'burger_stock_items';
const BILAN_KEY = 'burger_bilan_ingredients';
const VENTES_KEY = 'burger_ventes_ingredients';

export class EmptyStockManager {

  // 1. GESTION STOCK PRINCIPAL
  static getCurrentStock(): StockItem[] {
    const stored = localStorage.getItem(STOCK_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static saveCurrentStock(items: StockItem[]): void {
    localStorage.setItem(STOCK_KEY, JSON.stringify(items));

    // SYNCHRONISATION AUTOMATIQUE
    this.syncToBilan(items);
    this.syncToVentes(items);
  }

  static addStockItem(item: Omit<StockItem, 'id' | 'derniere_mise_a_jour'>): StockItem {
    const newItem: StockItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      derniere_mise_a_jour: new Date().toISOString()
    };

    const currentStock = this.getCurrentStock();
    const updatedStock = [...currentStock, newItem];

    this.saveCurrentStock(updatedStock);

    return newItem;
  }

  static updateStockItem(id: string, updates: Partial<StockItem>): boolean {
    const currentStock = this.getCurrentStock();
    const index = currentStock.findIndex(item => item.id === id);

    if (index === -1) return false;

    currentStock[index] = {
      ...currentStock[index],
      ...updates,
      derniere_mise_a_jour: new Date().toISOString()
    };

    this.saveCurrentStock(currentStock);
    return true;
  }

  static deleteStockItem(id: string): boolean {
    const currentStock = this.getCurrentStock();
    const filteredStock = currentStock.filter(item => item.id !== id);

    if (filteredStock.length === currentStock.length) return false;

    this.saveCurrentStock(filteredStock);
    return true;
  }

  // 2. SYNCHRONISATION AVEC BILAN MENSUEL
  static syncToBilan(stockItems: StockItem[]): void {
    // Transformer les items de stock en format bilan
    const bilanItems = stockItems.map(item => ({
      id: item.id,
      nom: item.nom,
      quantite_debut_mois: item.quantite,
      quantite_fin_mois: item.quantite,
      quantite_utilisee: 0,
      quantite_achetee: 0,
      prix_unitaire: item.prix_unitaire,
      unite: item.unite,
      cout_total: item.quantite * item.prix_unitaire,
      category: item.category || 'Divers',
      derniere_mise_a_jour: item.derniere_mise_a_jour
    }));

    localStorage.setItem(BILAN_KEY, JSON.stringify(bilanItems));
  }

  static getBilanItems() {
    const stored = localStorage.getItem(BILAN_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // 3. SYNCHRONISATION AVEC GESTION VENTES
  static syncToVentes(stockItems: StockItem[]): void {
    // Transformer les items de stock en format ventes
    const ventesItems = stockItems.map(item => ({
      id: item.id,
      nom: item.nom,
      quantite_disponible: item.quantite,
      quantite_vendue: 0,
      prix_unitaire: item.prix_unitaire,
      unite: item.unite,
      chiffre_affaires: 0,
      category: item.category || 'Divers',
      emoji: item.emoji || '📦',
      derniere_mise_a_jour: item.derniere_mise_a_jour
    }));

    localStorage.setItem(VENTES_KEY, JSON.stringify(ventesItems));
  }

  static getVentesItems() {
    const stored = localStorage.getItem(VENTES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // 4. RÉINITIALISATION COMPLÈTE
  static resetAll(): void {
    localStorage.removeItem(STOCK_KEY);
    localStorage.removeItem(BILAN_KEY);
    localStorage.removeItem(VENTES_KEY);

    // Nettoyer aussi les anciennes clés
    localStorage.removeItem('current_ingredients');
    localStorage.removeItem('yesterday_ingredients');
    localStorage.removeItem('burger_ingredients');
    localStorage.removeItem('burger_sales');
    localStorage.removeItem('monthly_report_data');
  }

  // 5. STATISTIQUES
  static getStats() {
    const stock = this.getCurrentStock();
    const totalItems = stock.length;
    const totalValue = stock.reduce((sum, item) => sum + (item.quantite * item.prix_unitaire), 0);
    const categories = Array.from(new Set(stock.map(item => item.category).filter(Boolean))) as string[];

    return {
      totalItems,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCategories: categories.length,
      categories,
      isEmpty: totalItems === 0
    };
  }
}