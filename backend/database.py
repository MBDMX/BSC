"""
Database module for Burger Social Club
Provides SQLite persistence for products, stock history, and alerts configuration.
"""

import sqlite3
import os
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "burger_stock.db")


def get_connection():
    """Get a database connection with row factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode and Hyper-Speed pragmas
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")  # Faster writes, still safe in WAL
    conn.execute("PRAGMA mmap_size=268435456") # 256MB Memory Map for instant I/O
    conn.execute("PRAGMA busy_timeout=30000")  # 30 seconds
    return conn


def init_database():
    """Initialize database tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Products table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            quantite REAL DEFAULT 0,
            cout_unitaire REAL DEFAULT 0,
            seuil REAL DEFAULT 50,
            categorie TEXT DEFAULT 'Ingredient',
            fournisseur TEXT DEFAULT '',
            date_peremption TEXT,
            unite TEXT DEFAULT 'kg',
            type TEXT DEFAULT 'ING', -- 'ING', 'PREP', 'PRODUCT'
            image_url TEXT DEFAULT ''
        )
    """)
    
    # Stock history table (daily entries)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stock_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            qty_start REAL DEFAULT 0,
            qty_in REAL DEFAULT 0,
            qty_out REAL DEFAULT 0,
            qty_end REAL DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id),
            UNIQUE(product_id, date)
        )
    """)
    
    # Ensure 'unite' column exists (migration for existing DBs)
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN unite TEXT DEFAULT 'kg'")
    except sqlite3.OperationalError:
        pass
        
    # Ensure 'type' column exists
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN type TEXT DEFAULT 'ING'")
    except sqlite3.OperationalError:
        pass
        
    # Ensure 'image_url' column exists
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    # Alerts configuration table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            phone TEXT,
            enabled INTEGER DEFAULT 1,
            last_alert_sent TEXT
        )
    """)
    
    
    # Sales table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produit_nom TEXT NOT NULL,
            quantite INTEGER NOT NULL,
            prix_unitaire REAL NOT NULL,
            total REAL NOT NULL,
            date TEXT NOT NULL
        )
    """)

    # Recipes table (Dynamic composition of products)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            ingredient_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (ingredient_id) REFERENCES products(id),
            UNIQUE(product_id, ingredient_id)
        )
    """)

    # Performance Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(product_id)")

    # Expenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            type TEXT NOT NULL, -- 'FIXE' or 'VARIABLE'
            montant REAL NOT NULL,
            date TEXT NOT NULL, -- YYYY-MM-DD
            recurrence TEXT DEFAULT 'AUCUNE', -- 'MENSUEL', 'AUCUNE'
            quantite REAL DEFAULT NULL,
            unite TEXT DEFAULT NULL
        )
    """)
    
    # Ensure 'quantite' and 'unite' columns exist (migration for existing DBs)
    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN quantite REAL DEFAULT NULL")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN unite TEXT DEFAULT NULL")
    except sqlite3.OperationalError:
        pass
    
    # Settings table for notifications
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT,
            notifications_enabled INTEGER DEFAULT 1,
            email TEXT,
            email_notifications_enabled INTEGER DEFAULT 1,
            notification_frequency TEXT DEFAULT 'immediate',
            last_notification_sent TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Ensure email columns exist (migration for existing DBs)
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_notifications_enabled INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        pass
    
    # Insert default settings if table is empty
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO settings (phone_number, notifications_enabled, email, email_notifications_enabled, notification_frequency)
            VALUES (NULL, 1, NULL, 1, 'immediate')
        """)
    
    # Notification history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ingredient_name TEXT NOT NULL,
            ingredient_id INTEGER,
            stock_level REAL,
            threshold REAL,
            message TEXT,
            sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'sent'
        )
    """)

    # Invoices table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_upload TEXT NOT NULL,
            filename TEXT NOT NULL,
            supplier_name TEXT,
            total_amount REAL,
            invoice_date TEXT,
            status TEXT DEFAULT 'draft',
            ocr_raw_text TEXT,
            image_path TEXT,
            expense_id INTEGER,
            FOREIGN KEY (expense_id) REFERENCES expenses(id)
        )
    """)

    # Invoice items (Breakdown for stock updates)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT,
            quantite REAL,
            prix_unitaire REAL,
            total REAL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    # Link expenses back to invoices
    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN invoice_id INTEGER")
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()
    
    # Run refinements after tables are ensured
    try:
        migrate_refinements()
        migrate_types() # New migration for types
    except Exception as e:
        print(f"⚠️ Warning during refinements: {e}")

# Initial call moved into server startup or kept here with protection
# but better to avoid top-level code that hits DB.


# =========== PRODUCTS CRUD ===========

def get_all_products() -> List[Dict]:
    """Get all products from database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_product_by_id(product_id: int) -> Optional[Dict]:
    """Get a single product by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def add_product(product_data: Dict) -> Dict:
    """Add a new product and return it with its ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO products (nom, quantite, cout_unitaire, seuil, categorie, fournisseur, date_peremption, type, image_url, unite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        product_data.get("nom", ""),
        product_data.get("quantite", 0),
        product_data.get("cout_unitaire", 0),
        product_data.get("seuil", 50),
        product_data.get("categorie", "Ingredient"),
        product_data.get("fournisseur", ""),
        product_data.get("date_peremption"),
        product_data.get("type", "ING"),
        product_data.get("image_url", ""),
        product_data.get("unite", "kg")
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {**product_data, "id": new_id}


def update_product(product_id: int, product_data: Dict) -> Optional[Dict]:
    """Update a product by ID, supporting partial updates."""
    # Filter out unknown keys if necessary, or just rely on callers
    # Known columns from schema
    valid_columns = {
        "nom", "quantite", "cout_unitaire", "seuil", "categorie", 
        "fournisseur", "date_peremption", "type", "image_url", "unite", "show_in_dashboard"
    }
    
    # Pre-process data
    update_fields = {}
    for key, value in product_data.items():
        if key in valid_columns:
            if key == "quantite":
                value = round(float(value), 2)
            update_fields[key] = value
            
    if not update_fields:
        return None # Nothing to update
        
    set_clause = ", ".join([f"{col} = ?" for col in update_fields.keys()])
    values = list(update_fields.values())
    values.append(product_id)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(f"UPDATE products SET {set_clause} WHERE id = ?", values)
    
    conn.commit()
    affected = cursor.rowcount
    
    # If successful, we might want to return the updated record, but we don't have it fully here.
    # The caller usually just checks not None.
    # Note: returning {**product_data} merges valid updates.
    
    conn.close()
    return {**product_data, "id": product_id} if affected > 0 else None


def delete_product(product_id: int) -> bool:
    """Delete a product by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


# =========== RECIPES CRUD ===========

def get_product_recipe(product_id: int) -> Dict[int, float]:
    """Get the recipe for a product (ingredient_id -> quantity)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ingredient_id, quantity FROM recipes WHERE product_id = ?", (product_id,))
    rows = cursor.fetchall()
    conn.close()
    return {row["ingredient_id"]: row["quantity"] for row in rows}

def get_all_recipes() -> Dict[int, Dict[int, float]]:
    """Get all recipes in a single batch (product_id -> {ingredient_id -> quantity})."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT product_id, ingredient_id, quantity FROM recipes")
    rows = cursor.fetchall()
    conn.close()
    
    recipes_map = {}
    for row in rows:
        pid = row["product_id"]
        if pid not in recipes_map:
            recipes_map[pid] = {}
        recipes_map[pid][row["ingredient_id"]] = row["quantity"]
    return recipes_map

def update_product_recipe(product_id: int, ingredients: List[Dict]):
    """Update recipe for a product (full replace)."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Clear existing recipe
        cursor.execute("DELETE FROM recipes WHERE product_id = ?", (product_id,))
        
        # Add new ingredients
        for ing in ingredients:
            # Handle both formats: dictionary from frontend or internal usage
            ing_id = ing.get("id") or ing.get("ingredient_id") or ing.get("item_id")
            qty = float(ing.get("qte") or ing.get("quantity") or 0)
            
            if ing_id and qty > 0:
                cursor.execute("""
                    INSERT INTO recipes (product_id, ingredient_id, quantity)
                    VALUES (?, ?, ?)
                """, (product_id, ing_id, qty))
        
        # If it has a recipe, it's likely a PREP item (if it was ING)
        # Note: We don't auto-update type here to avoid overriding user choice, 
        # but in migration we do.
        
        conn.commit()
    except Exception as e:
        print(f"❌ Error updating recipe for {product_id}: {e}")
        conn.rollback()
    finally:
        conn.close()

# =========== STOCK HISTORY ===========

def add_stock_entry(product_id: int, qty_start: float, qty_in: float, qty_out: float, notes: str = "", entry_date: str = None, cursor=None) -> Dict:
    """Add or update a daily stock entry for a product (Cumulative)."""
    target_date = entry_date if entry_date else date.today().isoformat()
    
    should_close = False
    if cursor is None:
        conn = get_connection()
        cursor = conn.cursor()
        should_close = True
    
    # Check if we already have an entry for this product on this day
    cursor.execute(
        "SELECT id, qty_start, qty_in, qty_out FROM stock_history WHERE product_id = ? AND date = ?",
        (product_id, target_date)
    )
    existing = cursor.fetchone()
    
    if existing:
        # Accumulate values
        entry_id = existing[0]
        final_qty_start = existing[1] # Keep the original starting stock of the day
        final_qty_in = existing[2] + qty_in
        final_qty_out = existing[3] + qty_out
        final_qty_end = final_qty_start + final_qty_in - final_qty_out
        
        # Update existing entry
        cursor.execute("""
            UPDATE stock_history 
            SET qty_in = ?, qty_out = ?, qty_end = ?, notes = ?
            WHERE id = ?
        """, (final_qty_in, final_qty_out, final_qty_end, notes, entry_id))
    else:
        # Create new entry
        # If qty_start is 0 and it's a new entry, it might be an automated deduction after a sale.
        # We should fetch the current stock as starting stock for the day.
        if qty_start == 0:
            cursor.execute("SELECT quantite FROM products WHERE id = ?", (product_id,))
            row = cursor.fetchone()
            final_qty_start = row[0] if row else 0
        else:
            final_qty_start = qty_start

        final_qty_in = qty_in
        final_qty_out = qty_out
        final_qty_end = final_qty_start + final_qty_in - final_qty_out
        
        cursor.execute("""
            INSERT INTO stock_history (product_id, date, qty_start, qty_in, qty_out, qty_end, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (product_id, target_date, final_qty_start, final_qty_in, final_qty_out, final_qty_end, notes))
    
    # Always update the product's current master quantity
    print(f"DEBUG: Updating stock for product_id={product_id}: was {final_qty_start}, deducted {final_qty_out} today, total qty_end={final_qty_end}")
    cursor.execute("UPDATE products SET quantite = ? WHERE id = ?", (final_qty_end, product_id))
    
    if should_close:
        cursor.connection.commit()
        cursor.connection.close()
    
    return {
        "product_id": product_id,
        "date": target_date,
        "qty_start": final_qty_start,
        "qty_in": final_qty_in,
        "qty_out": final_qty_out,
        "qty_end": final_qty_end,
        "notes": notes
    }


def get_stock_history(product_id: int, limit: int = 30) -> List[Dict]:
    """Get stock history for a product (last N days)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM stock_history 
        WHERE product_id = ? 
        ORDER BY date DESC 
        LIMIT ?
    """, (product_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_all_stock_history_for_date(target_date: str) -> List[Dict]:
    """Get all stock entries for a specific date."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sh.*, p.nom as product_name
        FROM stock_history sh
        JOIN products p ON sh.product_id = p.id
        WHERE sh.date = ?
        ORDER BY p.nom
    """, (target_date,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_consumption_data(period: str = "daily", start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Get consumption analytics aggregated by period.
    
    Args:
        period: 'daily', 'weekly', 'monthly'
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
    
    Returns:
        List of dicts with: product_id, product_name, unite, period_label, total_consumed, cost
    """
    from datetime import datetime, timedelta
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Default date range: last 30 days
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_dt = datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=30)
        start_date = start_dt.strftime('%Y-%m-%d')
    
    # Build SQL query based on period
    if period == "daily":
        date_group = "DATE(sh.date)"
        period_label = "DATE(sh.date)"
    elif period == "weekly":
        # Group by week (ISO week number)
        date_group = "strftime('%Y-W%W', sh.date)"
        period_label = "strftime('%Y-W%W', sh.date)"
    elif period == "monthly":
        # Group by month
        date_group = "strftime('%Y-%m', sh.date)"
        period_label = "strftime('%Y-%m', sh.date)"
    else:
        date_group = "DATE(sh.date)"
        period_label = "DATE(sh.date)"
    
    query = f"""
        SELECT 
            p.id as product_id,
            p.nom as product_name,
            p.unite,
            p.type as product_type,
            p.cout_unitaire as price,
            {period_label} as period_label,
            SUM(sh.qty_out) as total_consumed,
            SUM(sh.qty_out * p.cout_unitaire) as total_cost
        FROM stock_history sh
        JOIN products p ON sh.product_id = p.id
        WHERE sh.qty_out > 0
          AND DATE(sh.date) >= ?
          AND DATE(sh.date) <= ?
        GROUP BY p.id, {date_group}
        ORDER BY period_label DESC, total_consumed DESC
    """
    
    cursor.execute(query, (start_date, end_date))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def migrate_types():
    """
    Migrate existing products to the new 'type' system.
    Rules:
    - Main Product -> PRODUCT
    - Ingredient -> ING (default)
    - Ingredient with Recipe -> PREP
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        products = cursor.execute("SELECT id, nom, categorie, type FROM products").fetchall()
        
        updates = []
        for p in products:
            pid, nom, cat, current_type = p
            new_type = current_type
            
            if cat == "Main Product":
                new_type = "PRODUCT"
            elif cat == "Ingredient":
                # Check if it has a recipe
                recipe_count = cursor.execute("SELECT COUNT(*) FROM recipes WHERE product_id = ?", (pid,)).fetchone()[0]
                if recipe_count > 0:
                    new_type = "PREP"
                elif current_type == "ING": 
                     # Only keep as ING if confirmed, or valid default.
                     # Actually, since we just added the column, everything is ING by default (from ALTER TABLE).
                     # So if it has no recipe, leaving it as ING is correct.
                     pass
            
            if new_type != current_type:
                updates.append((new_type, pid))
                
        if updates:
            cursor.executemany("UPDATE products SET type = ? WHERE id = ?", updates)
            conn.commit()
            print(f"✅ Migrated {len(updates)} products to new 'type' classification.")
            
    except Exception as e:
        print(f"❌ Error during type migration: {e}")
    finally:
        conn.close()


# =========== SALES CRUD ===========

def add_sale(produit_nom: str, quantite: int, prix_unitaire: float, entry_date: str = None) -> Dict:
    """Record a new sale."""
    target_date = entry_date if entry_date else datetime.now().isoformat()
    total = quantite * prix_unitaire
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sales (produit_nom, quantite, prix_unitaire, total, date)
        VALUES (?, ?, ?, ?, ?)
    """, (produit_nom, quantite, prix_unitaire, total, target_date))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "id": new_id,
        "produit_nom": produit_nom,
        "quantite": quantite,
        "prix_unitaire": prix_unitaire,
        "total": total,
        "date": target_date
    }


def get_recent_sales(limit: int = 50) -> List[Dict]:
    """Get recent sales history."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sales ORDER BY date DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# =========== EXPENSES CRUD ===========

def add_expense(nom: str, type_charge: str, montant: float, date_charge: str, recurrence: str = 'AUCUNE') -> Dict:
    """Add a new expense."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO expenses (nom, type, montant, date, recurrence)
        VALUES (?, ?, ?, ?, ?)
    """, (nom, type_charge, montant, date_charge, recurrence))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": new_id, "nom": nom, "type": type_charge, 
        "montant": montant, "date": date_charge, "recurrence": recurrence
    }

def get_expenses_by_month(year: int, month: int) -> List[Dict]:
    """Get expenses for a specific month."""
    conn = get_connection()
    cursor = conn.cursor()
    month_str = f"{year}-{month:02d}"
    
    cursor.execute("""
        SELECT * FROM expenses 
        WHERE strftime('%Y-%m', date) = ?
        ORDER BY date DESC
    """, (month_str,))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_expense(expense_id: int) -> bool:
    """Delete an expense by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def get_sales_summary(days: int = 30) -> Dict:
    """Get sales summary for the last N days."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Calculate start date
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    cursor.execute("""
        SELECT SUM(total) as revenue, COUNT(*) as count, SUM(quantite) as items 
        FROM sales 
        WHERE date >= ?
    """, (start_date,))
    row = cursor.fetchone()
    conn.close()
    
    return {
        "revenue": row["revenue"] if row["revenue"] else 0,
        "transaction_count": row["count"] if row["count"] else 0,
        "total_items": row["items"] if row["items"] else 0
    }

def get_sales_by_month(year: int, month: int) -> Dict:
    """Get sales summary and details for a specific month."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Calculate start and end date for the month
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
        
    cursor.execute("""
        SELECT * FROM sales 
        WHERE date >= ? AND date < ?
        ORDER BY date DESC
    """, (start_date, end_date))
    rows = cursor.fetchall()
    
    sales_list = [dict(row) for row in rows]
    
    # Calculate summary locally
    revenue = sum(s["total"] for s in sales_list)
    transaction_count = len(sales_list)
    total_items = sum(s["quantite"] for s in sales_list)
    
    conn.close()
    
    return {
        "summary": {
            "revenue": revenue,
            "transaction_count": transaction_count,
            "total_items": total_items
        },
        "transactions": sales_list
    }


# Initialize database on module import
def migrate_refinements():
    """Apply specific data corrections requested by the user."""
    # Use a fresh connection with a timeout to avoid locking issues
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # 1. Reclassify 'Meat' (ID 2) as Ingredient if it was Main Product
        cursor.execute("UPDATE products SET categorie = 'Ingredient' WHERE id = 2")
        
        # 2. Update units for 'Cheese' and 'JUST FRIES'
        # Cheese (ID 3)
        cursor.execute("UPDATE products SET unite = 'unité' WHERE id = 3")
        # JUST FRIES (ID 18)
        cursor.execute("UPDATE products SET unite = 'unité' WHERE id = 18")
        
        # 3. Set default threshold (seuil) to 10.0 for all ingredients except Bun (ID 1)
        cursor.execute("UPDATE products SET seuil = 10.0 WHERE categorie = 'Ingredient' AND id != 1")
        
        conn.commit()
        print("✅ Applied data refinements (categories, units, thresholds).")
    except sqlite3.OperationalError as e:
        if "locked" in str(e).lower():
            print("⚠️ Database is locked, refinements postponed.")
        else:
            print(f"❌ Refinement error: {e}")
    finally:
        conn.close()

def reset_all_transactions():
    """Reset all sales and stock history, and set product quantities to 0."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM sales")
        cursor.execute("DELETE FROM stock_history")
        cursor.execute("DELETE FROM expenses")
        cursor.execute("UPDATE products SET quantite = 0")
        conn.commit()
        print("✅ All transaction data reset for launch.")
        return True
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def delete_stock_history_entry(entry_id: int):
    """Delete a specific stock history entry."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM stock_history WHERE id = ?", (entry_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error deleting history entry: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def delete_sale_entry(sale_id: int):
    """Delete a specific sale entry."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM sales WHERE id = ?", (sale_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error deleting sale: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# Removed top-level calls to prevent 'database is locked' on multi-threading/restarts
# init_database() 
# migrate_refinements()


# =========== ANALYTICS AGGREGATION ===========
def get_average_daily_sales_by_product(days: int = 30) -> Dict[str, float]:
    """Calculate average daily quantity sold for each product over the last N days."""
    conn = get_connection()
    cursor = conn.cursor()
    
    start_date = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    cursor.execute("""
        SELECT produit_nom, SUM(quantite) as total_qty
        FROM sales
        WHERE date >= ?
        GROUP BY produit_nom
    """, (start_date,))
    
    rows = cursor.fetchall()
    conn.close()
    
    avg_map = {}
    for r in rows:
        nom, total = r
        avg_map[nom] = total / days
        
    return avg_map

def get_product_peak_times():
    """Find the most frequent sales hour for each product."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # We look at the last 60 days to have enough volume
    sixty_days_ago = (date.today() - timedelta(days=60)).strftime("%Y-%m-%d")
    
    cursor.execute("""
        SELECT 
            produit_nom, 
            strftime('%H', date) as hour,
            SUM(quantite) as volume
        FROM sales
        WHERE date >= ?
        GROUP BY produit_nom, hour
        ORDER BY produit_nom, volume DESC
    """, (sixty_days_ago,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Keep only the top hour for each product
    peak_times = {}
    for row in rows:
        nom, hour, _ = row
        if nom not in peak_times:
            # Format as "12h - 14h" (2h window as requested)
            try:
                h = int(hour)
                peak_times[nom] = f"{h:02d}h - {(h+2)%24:02d}h"
            except:
                peak_times[nom] = "Inconnu"
    
    return peak_times

def get_hourly_sales_heatmap(days: int = 30) -> Dict[str, Dict[str, int]]:
    """Generate heatmap data: sales volume by day of week and hour."""
    conn = get_connection()
    cursor = conn.cursor()
    
    start_date = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    cursor.execute("""
        SELECT 
            CASE CAST(strftime('%w', date) AS INTEGER)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END as day_name,
            strftime('%H:00', date) as hour,
            SUM(quantite) as volume
        FROM sales
        WHERE date >= ?
        GROUP BY day_name, hour
        ORDER BY day_name, hour
    """, (start_date,))
    
    rows = cursor.fetchall()
    conn.close()
    
    heatmap = {}
    for row in rows:
        day, hour, volume = row
        if day not in heatmap:
            heatmap[day] = {}
        heatmap[day][hour] = volume
        
    return heatmap

def get_hourly_sales_distribution(days: int = 30) -> List[Dict]:
    """Get total revenue by hour of day (0-23) for the last N days."""
    conn = get_connection()
    cursor = conn.cursor()
    
    start_date = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    cursor.execute("""
        SELECT 
            strftime('%H', date) as hour,
            SUM(total) as revenue,
            COUNT(*) as count
        FROM sales
        WHERE date >= ?
        GROUP BY hour
        ORDER BY hour
    """, (start_date,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Fill in missing hours
    result = {f"{h:02d}": {"revenue": 0, "count": 0} for h in range(24)}
    
    for r in rows:
        hour = r["hour"]
        if hour in result:
            result[hour] = {
                "revenue": r["revenue"],
                "count": r["count"]
            }
            
    return [{"hour": h, **data} for h, data in result.items()]

def get_analytics_summary(period_days: int = 30):
    """Aggregate data for the analytics dashboard."""
    conn = get_connection()
    cursor = conn.cursor()

    # Calculate startDate based on period
    today = date.today()
    start_date = (today - timedelta(days=period_days)).strftime("%Y-%m-%d")

    # 1. Total Revenue & Orders (in selected period)
    cursor.execute("SELECT SUM(total), COUNT(*), SUM(quantite) FROM sales WHERE date >= ?", (start_date,))
    row = cursor.fetchone()
    total_revenue_period = row[0] or 0.0
    total_orders_period = row[1] or 0
    total_items_period = row[2] or 0

    # 2. Top Performing Products (in selected period) - Sorted by Revenue (CA)
    cursor.execute("""
        SELECT s.produit_nom, SUM(s.quantite) as qty, SUM(s.total) as rev, p.id
        FROM sales s
        LEFT JOIN products p ON s.produit_nom = p.nom
        WHERE s.date >= ?
        GROUP BY s.produit_nom
        ORDER BY rev DESC
        LIMIT 5
    """, (start_date,))
    rows = cursor.fetchall()
    
    # Get peak times for products
    peak_times = get_product_peak_times() 
    
    top_products = []
    for r in rows:
        nom = r[0]
        # Include product_id (r[3])
        pid = r[3]
        top_products.append({
            "id": pid,  # NEW
            "nom": nom,
            "quantite_vendue": r[1],
            "chiffre_affaires": r[2],
            "peak_time": peak_times.get(nom, "N/A")
        })

    # 3. Stock Alerts (Real Time) - Not period dependent
    cursor.execute("SELECT nom, quantite, seuil FROM products WHERE quantite <= seuil")
    alerts = [{"produit": r[0], "quantite_actuelle": r[1], "seuil_minimum": r[2], "type": "critique" if r[1] <= r[2]/2 else "faible"} for r in cursor.fetchall()]

    # 4. Monthly Trends (Last 6 months) - Keep fixed for context or maybe dynamic?
    # User might want to see trends relevant to the period.
    # If period=7, monthly trends is useless. Daily sales chart is what matters.
    # Let's keep trends fixed to 6 months for now as general context.
    six_months_ago = (today - timedelta(days=180)).strftime("%Y-%m-%d")
    cursor.execute("""
        SELECT strftime("%Y-%m", date) as mois, SUM(total) as revenue, COUNT(*) as orders
        FROM sales
        WHERE date >= ?
        GROUP BY mois
        ORDER BY mois ASC
    """, (six_months_ago,))
    trends = [{"mois": r[0], "ventes": r[1], "commandes": r[2]} for r in cursor.fetchall()]
    
    # 5. Daily Sales (in selected period) for Chart
    cursor.execute("""
        SELECT date, SUM(total) as revenue, SUM(quantite) as qty
        FROM sales
        WHERE date >= ?
        GROUP BY date
        ORDER BY date ASC
    """, (start_date,))
    daily_sales = [{"date": r[0], "montant": r[1], "quantite": r[2]} for r in cursor.fetchall()]

    conn.close()

    return {
        "kpis": {
            "total_revenue": total_revenue_period,
            "total_orders": total_orders_period,
            "total_items": total_items_period
        },
        "top_products": top_products,
        "alerts": alerts,
        "trends": trends,
        "daily_sales": daily_sales,
        "peak_times": peak_times # Also include full map
    }


# =========== INGREDIENT PURCHASES ===========

def add_ingredient_purchase(product_id: int, quantity: float, prix_achat: float, date_achat: str = None) -> Dict:
    """
    Record an ingredient purchase, update stock, and create an expense entry.
    
    Args:
        product_id: ID of the ingredient product
        quantity: Quantity purchased (rounded to 2 decimals)
        prix_achat: Purchase price per unit (rounded to 2 decimals)
        date_achat: Purchase date (defaults to today)
    
    Returns:
        Dictionary with purchase details
    """
    target_date = date_achat if date_achat else date.today().isoformat()
    
    # Round to 2 decimal places
    quantity = round(quantity * 100) / 100
    prix_achat = round(prix_achat * 100) / 100
    montant_total = round((quantity * prix_achat) * 100) / 100
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get product details
    cursor.execute("SELECT nom, quantite, unite FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    
    if not product:
        conn.close()
        raise ValueError(f"Product with ID {product_id} not found")
    
    product_name = product["nom"]
    current_qty = product["quantite"]
    product_unite = product["unite"] or "kg"
    new_qty = round((current_qty + quantity) * 100) / 100
    
    # Update product quantity
    cursor.execute("UPDATE products SET quantite = ? WHERE id = ?", (new_qty, product_id))
    
    # Create expense entry for the purchase
    cursor.execute("""
        INSERT INTO expenses (nom, type, montant, date, recurrence, quantite, unite)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (f"Achat: {product_name}", "INGREDIENT_PURCHASE", montant_total, target_date, "AUCUNE", quantity, product_unite))
    
    expense_id = cursor.lastrowid
    
    # Add stock history entry
    cursor.execute("""
        INSERT OR REPLACE INTO stock_history (product_id, date, qty_start, qty_in, qty_out, qty_end, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (product_id, target_date, current_qty, quantity, 0, new_qty, f"Achat: {quantity} unités à {prix_achat} DT"))
    
    conn.commit()
    conn.close()
    
    return {
        "id": expense_id,
        "product_id": product_id,
        "product_name": product_name,
        "quantity": quantity,
        "prix_achat": prix_achat,
        "montant_total": montant_total,
        "date": target_date,
        "old_quantity": current_qty,
        "new_quantity": new_qty
    }


def get_ingredient_purchases(product_id: int = None, limit: int = 50) -> List[Dict]:
    """
    Get ingredient purchase history.
    
    Args:
        product_id: Optional product ID to filter by
        limit: Maximum number of records to return
    
    Returns:
        List of purchase records
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    if product_id:
        cursor.execute("""
            SELECT e.*, sh.qty_in as quantity, sh.product_id
            FROM expenses e
            LEFT JOIN stock_history sh ON DATE(e.date) = DATE(sh.date) AND sh.notes LIKE 'Achat:%'
            WHERE e.type = 'INGREDIENT_PURCHASE' AND sh.product_id = ?
            ORDER BY e.date DESC
            LIMIT ?
        """, (product_id, limit))
    else:
        cursor.execute("""
            SELECT e.*, sh.qty_in as quantity, sh.product_id
            FROM expenses e
            LEFT JOIN stock_history sh ON DATE(e.date) = DATE(sh.date) AND sh.notes LIKE 'Achat:%'
            WHERE e.type = 'INGREDIENT_PURCHASE'
            ORDER BY e.date DESC
            LIMIT ?
        """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# =========== PERIOD-BASED AGGREGATION ===========

def get_charges_by_period(year: int, month: int, period_type: str = "month") -> List[Dict]:
    """
    Get charges aggregated by period (day or month).
    
    Args:
        year: Year to filter
        month: Month to filter
        period_type: "day" or "month"
    
    Returns:
        List of aggregated charges by period
    """
    conn = get_connection()
    cursor = conn.cursor()
    month_str = f"{year}-{month:02d}"
    
    if period_type == "day":
        cursor.execute("""
            SELECT 
                date,
                strftime('%d', date) as day,
                SUM(CASE WHEN type = 'FIXE' THEN montant ELSE 0 END) as charges_fixes,
                SUM(CASE WHEN type = 'VARIABLE' THEN montant ELSE 0 END) as charges_variables,
                SUM(CASE WHEN type = 'INGREDIENT_PURCHASE' THEN montant ELSE 0 END) as charges_ingredients,
                SUM(CASE WHEN type NOT IN ('FIXE', 'VARIABLE', 'INGREDIENT_PURCHASE') THEN montant ELSE 0 END) as charges_autres,
                SUM(montant) as total_charges,
                COUNT(*) as nombre_charges
            FROM expenses
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY date
            ORDER BY date
        """, (month_str,))
    else:  # month
        cursor.execute("""
            SELECT 
                strftime('%Y-%m', date) as period,
                SUM(CASE WHEN type = 'FIXE' THEN montant ELSE 0 END) as charges_fixes,
                SUM(CASE WHEN type = 'VARIABLE' THEN montant ELSE 0 END) as charges_variables,
                SUM(CASE WHEN type = 'INGREDIENT_PURCHASE' THEN montant ELSE 0 END) as charges_ingredients,
                SUM(CASE WHEN type NOT IN ('FIXE', 'VARIABLE', 'INGREDIENT_PURCHASE') THEN montant ELSE 0 END) as charges_autres,
                SUM(montant) as total_charges,
                COUNT(*) as nombre_charges
            FROM expenses
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY period
        """, (month_str,))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_sales_by_period_custom(year: int, month: int, period_type: str = "month") -> List[Dict]:
    """
    Get sales aggregated by period (day or month).
    
    Args:
        year: Year to filter
        month: Month to filter
        period_type: "day" or "month"
    
    Returns:
        List of aggregated sales by period
    """
    conn = get_connection()
    cursor = conn.cursor()
    month_str = f"{year}-{month:02d}"
    
    if period_type == "day":
        cursor.execute("""
            SELECT 
                DATE(date) as date,
                strftime('%d', date) as day,
                SUM(total) as revenue,
                SUM(quantite) as total_items,
                COUNT(*) as transaction_count
            FROM sales
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY DATE(date)
            ORDER BY date
        """, (month_str,))
    else:  # month
        cursor.execute("""
            SELECT 
                strftime('%Y-%m', date) as period,
                SUM(total) as revenue,
                SUM(quantite) as total_items,
                COUNT(*) as transaction_count
            FROM sales
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY period
        """, (month_str,))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_bilan_by_period(year: int, month: int, period_type: str = "month") -> List[Dict]:
    """
    Get combined bilan (charges + sales) by period.
    
    Args:
        year: Year to filter
        month: Month to filter
        period_type: "day" or "month"
    
    Returns:
        List of combined bilan data with charges and sales
    """
    charges = get_charges_by_period(year, month, period_type)
    sales = get_sales_by_period_custom(year, month, period_type)
    
    # Create a map for easy lookup
    charges_map = {}
    for charge in charges:
        key = charge.get("date") or charge.get("period")
        charges_map[key] = charge
    
    sales_map = {}
    for sale in sales:
        key = sale.get("date") or sale.get("period")
        sales_map[key] = sale
    
    # Combine data
    all_periods = set(charges_map.keys()) | set(sales_map.keys())
    result = []
    
    for period in sorted(all_periods):
        charge_data = charges_map.get(period, {})
        sale_data = sales_map.get(period, {})
        
        total_charges = charge_data.get("total_charges", 0.0)
        revenue = sale_data.get("revenue", 0.0)
        profit = round((revenue - total_charges) * 100) / 100
        
        result.append({
            "period": period,
            "day": charge_data.get("day") or sale_data.get("day"),
            "revenue": round(revenue * 100) / 100,
            "charges_fixes": round(charge_data.get("charges_fixes", 0.0) * 100) / 100,
            "charges_variables": round(charge_data.get("charges_variables", 0.0) * 100) / 100,
            "charges_ingredients": round(charge_data.get("charges_ingredients", 0.0) * 100) / 100,
            "charges_autres": round(charge_data.get("charges_autres", 0.0) * 100) / 100,
            "total_charges": round(total_charges * 100) / 100,
            "profit": profit,
            "transaction_count": sale_data.get("transaction_count", 0),
            "total_items": sale_data.get("total_items", 0),
            "nombre_charges": charge_data.get("nombre_charges", 0)
        })
    
    return result


# =========== SETTINGS CRUD ===========

def get_settings():
    """Get notification settings."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {
        "phone_number": None,
        "notifications_enabled": 1,
        "email": None,
        "email_notifications_enabled": 1,
        "notification_frequency": "immediate"
    }


def update_settings(phone_number=None, notifications_enabled=1, email=None, email_notifications_enabled=1, notification_frequency="immediate"):
    """Update notification settings."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM settings LIMIT 1")
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("""
            UPDATE settings 
            SET phone_number = ?, 
                notifications_enabled = ?, 
                email = ?,
                email_notifications_enabled = ?,
                notification_frequency = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (phone_number, notifications_enabled, email, email_notifications_enabled, notification_frequency, existing[0]))
    else:
        cursor.execute("""
            INSERT INTO settings (phone_number, notifications_enabled, email, email_notifications_enabled, notification_frequency)
            VALUES (?, ?, ?, ?, ?)
        """, (phone_number, notifications_enabled, email, email_notifications_enabled, notification_frequency))
    
    conn.commit()
    conn.close()
    return get_settings()


def add_notification_history(ingredient_name, ingredient_id, stock_level, threshold, message, status="sent"):
    """Log a notification to history."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notification_history (ingredient_name, ingredient_id, stock_level, threshold, message, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (ingredient_name, ingredient_id, stock_level, threshold, message, status))
    conn.commit()
    conn.close()


def get_notification_history(limit=50):
    """Get notification history."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM notification_history 
        ORDER BY sent_at DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def migrate_recipes_from_dict(legacy_recipes: Dict):
    """Migrate hardcoded dictionary recipes to database table."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT COUNT(*) as count FROM recipes")
        count = cursor.fetchone()["count"]
        
        if count == 0:
            print("🍳 Migrating recipes to database...")
            for prod_id, ingredients in legacy_recipes.items():
                for ing_id, qty in ingredients.items():
                    cursor.execute("""
                        INSERT OR IGNORE INTO recipes (product_id, ingredient_id, quantity)
                        VALUES (?, ?, ?)
                    """, (prod_id, ing_id, qty))
            conn.commit()
            print("✅ Recipes migration complete.")
            
        # Verify migration success
        cursor.execute("SELECT COUNT(*) as count FROM recipes")
        final_count = cursor.fetchone()["count"]
        print(f"Recipe count in DB: {final_count}")
        
    except Exception as e:
        print(f"❌ Error migrating recipes: {e}")
    finally:
        conn.close()

def enforce_ingredient_units():
    """Update units for specific ingredients as requested."""
    conn = get_connection()
    cursor = conn.cursor()
    updates = [
        # Liters
        ("L", ["%eau%", "%lben%", "%huile%", "%lait%", "%vinaigre%", "%sirop%", "%jus%"]),
        # Units (Pieces)
        ("unité", ["%pain%", "%bun%", "%burger%", "%oeuf%", "%bouteille%", "%canette%"]),
        # Kg (Default for others usually, but explicit here)
        ("kg", ["%viande%", "%poulet%", "%frite%", "%oignon%", "%tomate%", "%pomme de terre%", "%farine%", "%sel%", "%fromage%"])
    ]
    
    try:
        for unit, patterns in updates:
            for pattern in patterns:
                cursor.execute("UPDATE products SET unite = ? WHERE nom LIKE ? AND unite != ?", (unit, pattern, unit))
        conn.commit()
        print("✅ Ingredient units enforced.")
    except Exception as e:
        print(f"❌ Error enforcing units: {e}")
    finally:
        conn.close()


def migrate_initial_data(products_list: List[Dict]):
    """Migrate existing in-memory products to the database (first-time setup)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if products table is empty
    cursor.execute("SELECT COUNT(*) as count FROM products")
    count = cursor.fetchone()["count"]
    
    if count == 0 and products_list:
        for p in products_list:
            cursor.execute("""
                INSERT INTO products (id, nom, quantite, cout_unitaire, seuil, categorie, fournisseur, date_peremption)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p.get("id"),
                p.get("nom", ""),
                p.get("quantite", 0),
                p.get("cout_unitaire", 0),
                p.get("seuil", 50),
                p.get("categorie", "Ingredient"),
                p.get("fournisseur", ""),
                p.get("date_peremption")
            ))
        conn.commit()
        print(f"✅ Migrated {len(products_list)} products to SQLite database.")
    
    conn.close()


def migrate_product_display_names():
    """
    Ensure main finished products have unified display names (with both languages)
    so they appear consistently across all pages.
    """
    conn = get_connection()
    cursor = conn.cursor()

    updates = [
        (5, "CHICKEN (بودجاج)"),
        (6, "TRIPLE (بوثلاثة)"),
        (18, "JUST FRIES (Fries Regular)"),
        (19, "QUADRIPLE (بوأربعة)"),
        (20, "Tenders (لحنين)"),
        (21, "DOUBLE (بوزوز)"),
        (22, "Regular (العادي)"),
    ]

    for pid, name in updates:
        cursor.execute("UPDATE products SET nom = ? WHERE id = ?", (name, pid))

    conn.commit()
    conn.close()


def delete_salade():
    """Delete the 'Salade' ingredient from products table (if it exists)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE nom LIKE 'Salade%'")
    conn.commit()
    conn.close()


def migrate_main_product_prices():
    """
    Ensure main finished products have updated unit prices so that
    all frontends using cout_unitaire see the same selling price.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Map product IDs to new desired prices
    updates = [
        (5, 18.0),   # CHICKEN
        (6, 29.0),   # TRIPLE
        (18, 7.0),   # JUST FRIES
        (19, 36.0),  # QUADRIPLE
        (20, 12.0),  # Tenders
        (21, 22.0),  # DOUBLE
        (22, 15.0),  # Regular
    ]

    for pid, price in updates:
        cursor.execute("UPDATE products SET cout_unitaire = ? WHERE id = ?", (price, pid))

    conn.commit()
    conn.close()


def apply_data_refinements_v2():
    """
    Apply user requested updates:
    1. Add new ingredients from photos.
    2. Set types (PREP, PRODUCT, ING).
    3. Add recipes for PREP items.
    """
    conn = get_connection()
    cursor = conn.cursor()
    print("🔄 Applying Data Refinements V2...")

    # 1. Add New Ingredients (ING)
    # Unit assumption: kg/L/unit based on name or context.
    new_ingredients = [
        ("Cucumber", "kg"), 
        ("Vinaigre", "L"), 
        ("Mustard seed", "kg"), 
        ("Coriander seed (Tebel)", "kg"),
        ("Peppercorn", "kg"), 
        ("Bay leaves (Rand)", "kg"), 
        ("Garlic", "kg"),
        ("Honey", "kg"),
        ("Harissa", "kg"),  # Can be unit package
        ("Butter", "kg"),
        ("Mayo", "kg"),
        ("Ketchup", "kg"),
        ("Mustard", "kg"),
        ("Curcumin", "kg"),
        ("Sugar", "kg"),
        ("Egg", "unité"),
        ("Milk", "L"),
        ("Baking powder", "kg"), # or sachet
    ]
    
    for nom, unite in new_ingredients:
        # Check if exists (fuzzy match)
        cursor.execute("SELECT id FROM products WHERE nom LIKE ? OR nom = ?", (f"%{nom}%", nom))
        if cursor.fetchone() is None:
            cursor.execute("""
                INSERT INTO products (nom, quantite, cout_unitaire, seuil, categorie, type, unite)
                VALUES (?, 0, 0, 5, 'Ingredient', 'ING', ?)
            """, (nom, unite))
            print(f"   ➕ Added ingredient: {nom}")

    # 2. Update Types
    # PREP: pickels, bun, sweet sour sauce, secret sauce
    prep_items = ["%Pickels%", "%Bun%", "%Sweet sour sauce%", "%Secret sauce%"]
    for pattern in prep_items:
        cursor.execute("UPDATE products SET type = 'PREP' WHERE nom LIKE ?", (pattern,))
        
    # PRODUCT: double, triple, regular, chicken, quadruple, tenders, Fries regular
    product_items = ["%DOUBLE%", "%TRIPLE%", "%Regular%", "%CHICKEN%", "%QUADRIPLE%", "%Tenders%", "%JUST FRIES%"]
    for pattern in product_items:
        cursor.execute("UPDATE products SET type = 'PRODUCT' WHERE nom LIKE ?", (pattern,))
        
    # ING: All others with categorie='Ingredient' (already default, but ensure)
    # Actually, we rely on default ING.

    conn.commit()
    
    # helper to get ID by name (fuzzy)
    def get_id(name_pattern):
        cursor.execute("SELECT id FROM products WHERE nom LIKE ?", (name_pattern,))
        row = cursor.fetchone()
        return row[0] if row else None

    # 3. Update Recipes for PREP items (so Prod Max works)
    # We clear existing recipes for these items first to avoid dupes/conflicts
    
    # BUN (PREP)
    bun_id = get_id("%Bun%")
    if bun_id:
        # Ingredients for 1 Unit of Bun (derived from Proportion/Exemple)
        # Proportion column was for 100 buns? Let's assume Example values / 10 is for 10 buns?
        # Actually photos said "Préparé pour 100".
        # Potato 3kg -> 0.03/bun
        # Flour 4.5kg -> 0.045/bun
        # Curcumin 0.02kg -> 0.0002/bun
        # Butter 0.38kg -> 0.0038/bun
        # Sugar 0.3kg -> 0.003/bun
        # Egg 260g (0.26kg) -> 0.0026/bun (using kg) OR 5 eggs for 3kg prop? 
        # Let's use the explicit list: Egg 5. If 5 eggs makes 100 buns? That's 0.05 egg/bun.
        # Let's trust the "Proportion" mass column for consistency generally.
        # Egg: 260g for 100 buns = 2.6g/bun. 
        # Milk 1.2kg -> 0.012/bun
        # Baking powder 0.08kg -> 0.0008/bun
        # Salt 0.08kg -> 0.0008/bun
        
        ingredients = {
            "%Potato%": 0.03,
            "%Flour%": 0.045,
            "%Curcumin%": 0.0002,
            "%Butter%": 0.0038,
            "%Sugar%": 0.003,
            "%Egg%": 0.05, # Using units: 5 eggs for 100 buns = 0.05
            "%Milk%": 0.012,
            "%Baking powder%": 0.0008,
            "%Salt%": 0.0008
        }
        
        cursor.execute("DELETE FROM recipes WHERE product_id = ?", (bun_id,))
        for pat, qty in ingredients.items():
            ing_id = get_id(pat)
            if ing_id:
                cursor.execute("INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES (?, ?, ?)", (bun_id, ing_id, qty))

    # Pickels (PREP) - Proportion column (Pour 1 unit/kg)
    pickels_id = get_id("%Pickels%")
    if pickels_id:
        ingredients = {
            "%Cucumber%": 1.0, # 1kg
            "%Vinaigre%": 1.0, # 1L
            "%Water%": 1.0,
            "%Salt%": 0.05,
            "%Mustard seed%": 0.06,
            "%Coriander%": 0.06,
            "%Peppercorn%": 0.06,
            "%Bay%": 0.002,
            "%Garlic%": 0.02
        }
        cursor.execute("DELETE FROM recipes WHERE product_id = ?", (pickels_id,))
        for pat, qty in ingredients.items():
            ing_id = get_id(pat)
            if ing_id and ing_id != pickels_id: # Avoid self-ref
                 cursor.execute("INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES (?, ?, ?)", (pickels_id, ing_id, qty))

    # Sweet Sour Sauce (PREP) - Proportion (Pour 1)
    sss_id = get_id("%Sweet sour sauce%")
    if sss_id:
        ingredients = {
            "%Honey%": 0.25,
            "%Harissa%": 0.25,
            "%Water%": 0.25,
            "%Butter%": 0.5
        }
        cursor.execute("DELETE FROM recipes WHERE product_id = ?", (sss_id,))
        for pat, qty in ingredients.items():
            ing_id = get_id(pat)
            if ing_id:
                 cursor.execute("INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES (?, ?, ?)", (sss_id, ing_id, qty))

    # Secret Sauce (PREP) - Proportion (Pour 1)
    ss_id = get_id("%Secret sauce%")
    if ss_id:
        ingredients = {
            "%Mayo%": 0.5,
            "%Ketchup%": 0.25,
            "%Mustard%": 0.25,
            "%Pickels%": 0.05, # Uses PREP pickels!
            "%Ognon%": 0.05, # Use 'Ognon' not Oignon to match DB
            "%Salt%": 0.015
        }
        cursor.execute("DELETE FROM recipes WHERE product_id = ?", (ss_id,))
        for pat, qty in ingredients.items():
            ing_id = get_id(pat)
            if ing_id and ing_id != ss_id:
                 cursor.execute("INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES (?, ?, ?)", (ss_id, ing_id, qty))

    conn.commit()
    conn.close()
    print("✅ Data Refinements V2 Applied.")


def apply_data_refinements_v3():
    """
    Apply user requested updates V3:
    1. Rename 'RAW' -> 'ING' in DB.
    2. Add 'show_in_dashboard' column.
    3. Hide new ingredients from dashboard.
    """
    conn = get_connection()
    cursor = conn.cursor()
    print("🔄 Applying Data Refinements V3...")

    # 1. Add show_in_dashboard column if not exists
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN show_in_dashboard INTEGER DEFAULT 1")
    except Exception:
        pass # Already exists

    # 2. Rename RAW -> ING
    cursor.execute("UPDATE products SET type = 'ING' WHERE type = 'RAW'")

    # 3. Hide specific new ingredients from dashboard
    hidden_ingredients = [
        "Cucumber", "Vinaigre", "Mustard seed", "Coriander seed (Tebel)",
        "Peppercorn", "Bay leaves (Rand)", "Garlic", "Honey", "Harissa",
        "Butter", "Mayo", "Ketchup", "Mustard", "Curcumin", "Sugar",
        "Egg", "Milk", "Baking powder"
    ]
    
    for nom in hidden_ingredients:
        cursor.execute("UPDATE products SET show_in_dashboard = 0 WHERE nom LIKE ? OR nom = ?", (f"%{nom}%", nom))

    conn.commit()
    conn.close()
    print("✅ Data Refinements V3 Applied.")


def get_alerts_config() -> Optional[Dict]:
    """Get the current alerts configuration."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts_config LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_hourly_sales_distribution(start_date: str, end_date: str, product_id: int = None) -> List[Dict]:
    """
    Get sales distribution by hour (00-23).
    If product_id is provided, filter by that product.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT strftime('%H', date) as hour, SUM(total) as revenue, COUNT(*) as count
        FROM sales 
        WHERE date(date) BETWEEN ? AND ?
    """
    params = [start_date, end_date]
    
    if product_id:
        # Get product name first
        cursor.execute("SELECT nom FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        if row:
            product_name = row['nom']
            query += " AND produit_nom = ?"
            params.append(product_name)
        else:
            # Product not found, return empty
            conn.close()
            return []
            
    query += " GROUP BY hour ORDER BY hour"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Fill missing hours with 0
    results_map = {row['hour']: {'revenue': row['revenue'], 'count': row['count']} for row in rows}
    final_results = []
    
    for h in range(24):
        hour_str = f"{h:02d}"
        data = results_map.get(hour_str, {'revenue': 0, 'count': 0})
        final_results.append({
            "hour": hour_str,
            "revenue": data['revenue'],
            "count": data['count']
        })
        
    return final_results

