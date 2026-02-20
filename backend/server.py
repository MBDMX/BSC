from fastapi import FastAPI, Depends, HTTPException, status, Body, Request, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta, date
import jwt
import os
import asyncio
import shutil
import re
import ocr_service
import time

# === HYPER-SPEED CACHE ===
class SimpleCache:
    def __init__(self, ttl=30):
        self.cache = {}
        self.ttl = ttl # Cache data for 30 seconds

    def get(self, key):
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            del self.cache[key]
        return None

    def set(self, key, value):
        self.cache[key] = (value, time.time())

    def clear(self):
        self.cache = {}

global_cache = SimpleCache()

# === IMPORTS ANALYTICS ===
# import numpy as np
# import pandas as pd
# from app.services.analytics_service import AnalyticsService
# from app.services.powerbi_service import PowerBIService
# from app.models.analytics_models import (
#     KPIMetrics, StockPrediction, SalesForecast, PriceRecommendation,
#     AnomalyAlert, SeasonalAnalysis, SupplierAnalytics, BusinessInsights,
#     PowerBIDashboard, MLModel, PredictionType, AnomalyType
# )
# from app.controllers.analytics_controller import router as analytics_router
# from app.utils.auth import get_current_user, authenticate_user, create_access_token, oauth2_scheme

# Fonction temporaire pour permettre au serveur de démarrer
def get_current_user():
    return {"username": "admin", "role": "admin"}

def authenticate_user(username, password):
    return {"username": username, "role": "admin"}

def create_access_token(data):
    return "fake_token"

# === IMPORT DATABASE & ALERTS ===
import database as db
import alerts

# === APPLICATION ===
app = FastAPI(title="Burger Manager API", version="2.0.0", description="API de gestion de stock avec Analytics et Business Intelligence")

# Monter l'application socket.io (commenté car socket_app n'est pas défini)
# app.mount("/ws", socket_app)

origins = [
    "http://localhost:3000",
    "http://localhost:3001"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for manual invoice verification
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory=os.path.abspath("uploads")), name="uploads")

# === SERVICES ANALYTICS ===
# analytics_service = AnalyticsService()
# powerbi_service = PowerBIService()

# === INCLUSION DES ROUTERS ===
# app.include_router(analytics_router)

# === IMPORT DU ROUTER MENU ===
from app.controllers.menu_controller import router as menu_router
app.include_router(menu_router)

# === IMPORT DU ROUTER STOCK ===
from app.controllers.stock_controller import router as stock_router
app.include_router(stock_router)

# === SCHÉMAS ===
class Token(BaseModel):
    access_token: str
    token_type: str

class KPI(BaseModel):
    recette: float
    charges: float
    objectif: float

class Product(BaseModel):
    nom: str
    quantite: float
    cout_unitaire: float
    seuil: float = 50.0
    categorie: str = "Ingredient"  # "Main Product" or "Ingredient"
    fournisseur: str = "Contact: 0123456789"
    date_peremption: Optional[str] = None
    unite: Optional[str] = "kg"
    type: Optional[str] = "RAW" # RAW, PREP, PRODUCT
    image_url: Optional[str] = ""
    ingredients: Optional[List[Dict]] = [] # List of {"id": int, "quantity": float}

# ... (Previous classes) ...

@app.post("/add-product")
async def add_product_route(product_data: Product = Body(...), current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    
    # Extract ingredients before saving product
    ingredients = product_data.ingredients
    
    # Save product
    new_product = db.add_product(product_data.dict(exclude={"ingredients"}))
    print(f"Produit ajouté: {new_product}")
    
    # Save recipe if ingredients exist
    if ingredients:
        db.update_product_recipe(new_product["id"], ingredients)
    
    # Trigger alerts check
    all_products = db.get_all_products()
    config = db.get_alerts_config()
    if config and config.get("email") and config.get("enabled"):
        alerts.trigger_alerts_if_needed(all_products, config["email"])
    
    # Invalidate cache
    global_cache.clear()
    
    # Return product with ID
    return {"message": "Produit ajouté avec succès", "product": new_product}

class ProductUpdate(BaseModel):
    nom: Optional[str] = None
    quantite: Optional[float] = None
    cout_unitaire: Optional[float] = None
    seuil: Optional[float] = None
    categorie: Optional[str] = None
    fournisseur: Optional[str] = None
    date_peremption: Optional[str] = None
    unite: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    ingredients: Optional[List[Dict]] = None

@app.put("/update-product/{id}")
async def update_product_route(id: int, product_data: ProductUpdate, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    
    ingredients = product_data.ingredients
    
    # Use exclude_unset to only send fields that were actually provided
    updated = db.update_product(id, product_data.dict(exclude={"ingredients"}, exclude_unset=True))
    if not updated:
        # If db update returns None, it might mean nothing to update OR row not found.
        # But our db.update_product returns None only if id not found OR no fields.
        # Check if product exists?
        existing = db.get_product_by_id(id)
        if not existing:
             raise HTTPException(status_code=404, detail="Produit non trouvé")
        # If existing but no fields updated, just return success
        updated = existing
    
    if ingredients is not None:
        db.update_product_recipe(id, ingredients)
    
    print(f"Produit mis à jour: {updated}")
    
    # Trigger alerts check
    all_products = db.get_all_products()
    config = db.get_alerts_config()
    if config and config.get("email") and config.get("enabled"):
        alerts.trigger_alerts_if_needed(all_products, config["email"])
    
    # Invalidate cache
    global_cache.clear()
    
    return {"message": "Produit mis à jour avec succès", "product": updated}
    id: int

class DeleteProductRequest(BaseModel):
    product_id: int

class StockHistory(BaseModel):
    date: str
    stock_initial: float
    stock_vendu: float
    stock_restant: float

class BurgerEstimation(BaseModel):
    ingredients: List[Dict[str, float]]
    tva: float = 0.19
    remise: float = 0.0
    marge: float = 0.2

class ChargesSummary(BaseModel):
    components: List[Dict[str, float]]
    indirect_charges: float = 500.0

# === DONNÉES SIMULÉES (KPI seulement, products vient de la DB) ===
kpi_data = KPI(recette=3000.0, charges=2000.0, objectif=5000.0)

# Initial products for migration (only used if DB is empty)
_initial_products = [
    {"id": 1, "nom": "Bun", "quantite": 1000, "cout_unitaire": 0.5, "seuil": 100.0, "categorie": "Ingredient", "fournisseur": "Boulangerie: 0123456789"},
    {"id": 2, "nom": "Meat", "quantite": 50.0, "cout_unitaire": 1.5, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": "Bucherie: 0987654321"},
    {"id": 3, "nom": "Cheese", "quantite": 100.0, "cout_unitaire": 2.0, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": "Fromagerie: 0555666777", "unite": "unité"},
    {"id": 5, "nom": "CHICKEN (بودجاج)", "quantite": 150.0, "cout_unitaire": 12.5, "seuil": 30.0, "categorie": "Main Product", "fournisseur": "Cuisine"},
    {"id": 6, "nom": "TRIPLE (بوثلاثة)", "quantite": 100.0, "cout_unitaire": 18.5, "seuil": 20.0, "categorie": "Main Product", "fournisseur": "Cuisine"},
    {"id": 7, "nom": "Pickels", "quantite": 10.0, "cout_unitaire": 5.0, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 8, "nom": "Sweet sour sauce", "quantite": 5.0, "cout_unitaire": 8.0, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 9, "nom": "Secret sauce", "quantite": 5.0, "cout_unitaire": 10.0, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 10, "nom": "Ognon", "quantite": 20.0, "cout_unitaire": 1.2, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 11, "nom": "Lben", "quantite": 10.0, "cout_unitaire": 2.5, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 12, "nom": "Flour", "quantite": 50.0, "cout_unitaire": 1.0, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 13, "nom": "Water", "quantite": 100.0, "cout_unitaire": 0.1, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 14, "nom": "Salt", "quantite": 5.0, "cout_unitaire": 0.5, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 15, "nom": "Chicken", "quantite": 40.0, "cout_unitaire": 10.0, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 16, "nom": "Fries", "quantite": 60.0, "cout_unitaire": 3.5, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 17, "nom": "Oil", "quantite": 20.0, "cout_unitaire": 4.5, "seuil": 10.0, "categorie": "Ingredient", "fournisseur": ""},
    {"id": 18, "nom": "JUST FRIES (Fries Regular)", "quantite": 100.0, "cout_unitaire": 5.5, "seuil": 20.0, "categorie": "Main Product", "fournisseur": "Cuisine", "unite": "unité"},
    {"id": 19, "nom": "QUADRIPLE (بوأربعة)", "quantite": 80.0, "cout_unitaire": 25.0, "seuil": 15.0, "categorie": "Main Product", "fournisseur": "Cuisine"},
    {"id": 20, "nom": "Tenders (لحنين)", "quantite": 120.0, "cout_unitaire": 15.0, "seuil": 25.0, "categorie": "Main Product", "fournisseur": "Cuisine"},
    {"id": 21, "nom": "DOUBLE (بوزوز)", "quantite": 150.0, "cout_unitaire": 18.0, "seuil": 30.0, "categorie": "Main Product", "fournisseur": "Cuisine"},
    {"id": 22, "nom": "Regular (العادي)", "quantite": 200.0, "cout_unitaire": 12.0, "seuil": 40.0, "categorie": "Main Product", "fournisseur": "Cuisine"},
]

# Migrate initial data to database on first run and normalize data
# db.migrate_initial_data(_initial_products)
# db.migrate_product_display_names()
# db.delete_salade()
# db.migrate_main_product_prices()

# === FONCTIONS JWT ===
# authenticate_user, create_access_token, oauth2_scheme are now imported from auth utility

# === ROUTES ===
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Identifiants incorrects")
    access_token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/dashboard-data")
async def get_dashboard_data(include_hidden: bool = False, current_user: Dict = Depends(get_current_user)):
    # Hyper-Speed Cache check
    cache_key = f"dashboard_{include_hidden}"
    cached = global_cache.get(cache_key)
    if cached:
        return cached

    all_products = db.get_all_products()
    
    # Filter hidden products
    if include_hidden:
        products = all_products
    else:
        # Check if 'show_in_dashboard' key exists (will be there after update)
        products = [p for p in all_products if p.get('show_in_dashboard', 1) == 1]
    
    # Fetch all recipes in one go to avoid N+1 queries
    all_recipes = db.get_all_recipes()
    
    # Attach recipes to products for frontend calculation
    for p in products:
        p['recipe'] = all_recipes.get(p['id'], {})

    # Calculate real-time KPI metrics for the current month
    today = datetime.now()
    start_month = today.replace(day=1).strftime("%Y-%m-%d")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    # Revenue (Month-to-Date)
    cursor.execute("SELECT SUM(total) FROM sales WHERE date >= ?", (start_month,))
    rev = cursor.fetchone()[0] or 0.0
    # Charges (Month-to-Date)
    cursor.execute("SELECT SUM(montant) FROM expenses WHERE date >= ?", (start_month,))
    chg = cursor.fetchone()[0] or 0.0
    conn.close()

    # Create dynamic KPI object
    dynamic_kpi = KPI(
        recette=round(rev * 100) / 100,
        charges=round(chg * 100) / 100,
        objectif=kpi_data.objectif
    )

    # Get yesterday's date dynamically
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    yesterday_history = db.get_all_stock_history_for_date(yesterday)
    
    yesterday_stock_mapped = []
    for s in yesterday_history:
        yesterday_stock_mapped.append({
            "product_id": s["product_id"],
            "stock_initial": s["qty_start"],
            "stock_vendu": s["qty_out"],
            "stock_restant": s["qty_end"]
        })
    
    result = {
        "kpi": dynamic_kpi.dict(),
        "products": products,
        "yesterday_stock": yesterday_stock_mapped,
        "yesterday_date": yesterday
    }
    
    # Store in cache
    global_cache.set(cache_key, result)
    return result

@app.get("/menu-data")
async def get_menu_data():
    """Returns products and their ingredients (recipes)."""
    # Hyper-Speed Cache check
    cache_key = "menu_data"
    cached = global_cache.get(cache_key)
    if cached:
        return cached

    try:
        all_products = db.get_all_products()
        main_products = [p for p in all_products if p['categorie'] == "Main Product"]
        
        # Merge products with their hardcoded recipes
        # Map products by ID for ingredient name lookup
        prod_map = {p['id']: p for p in all_products}
        
        # Fetch all recipes once to avoid N+1 queries
        all_recipes = db.get_all_recipes()
        
        # Merge products with their recipes
        menu = []
        for p in main_products:
            recipe = all_recipes.get(p['id'], {})
            
            menu.append({
                "id": p['id'],
                "nom": p['nom'],
                "prix": p['cout_unitaire'],
                "categorie": p['categorie'],
                "ingredients": [
                    {
                        "nom": prod_map[ing_id]['nom'] if ing_id in prod_map else f"Ing-ID-{ing_id}", 
                        "quantite": qty,
                        "prix_achat": prod_map[ing_id]['cout_unitaire'] if ing_id in prod_map else 0
                    } 
                    for ing_id, qty in recipe.items()
                ]
            })
            
        global_cache.set(cache_key, menu)
        return menu
    except Exception as e:
        print(f"Error in menu-data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug-test")
async def debug_test():
    try:
        y = (datetime.now() - timedelta(days=1)).date().isoformat()
        db_path = db.DB_PATH
        history = db.get_all_stock_history_for_date(y)
        return {
            "debug_yesterday": y,
            "db_path": db_path,
            "history_count": len(history),
            "history_sample": history,
            "cwd": os.getcwd()
        }
    except Exception as e:
        return {"error": str(e)}

# === SALES ENDPOINTS ===

class SaleCreate(BaseModel):
    produit_nom: str
    produit_id: Optional[int] = None # Support ID-based matching
    quantite: int
    prix_unitaire: float
    date: Optional[str] = None  # Format ISO ou YYYY-MM-DD HH:MM:SS

@app.post("/sales", status_code=201)
async def create_sale(sale: SaleCreate):
    """Record a sale and deduct stock based on recipes (using IDs)."""
    try:
        # 1. Record the sale
        # Pass the custom date to the database function
        new_sale = db.add_sale(
            sale.produit_nom, 
            sale.quantite, 
            sale.prix_unitaire, 
            entry_date=sale.date
        )
        
        # 2. Find the product ID
        all_products = db.get_all_products()
        main_product = None
        
        if sale.produit_id:
            main_product = next((p for p in all_products if p['id'] == sale.produit_id), None)
        
        if not main_product:
            main_product = next((p for p in all_products if p['nom'] == sale.produit_nom), None)
        
        if main_product:
            # Get recipe from database
            recipe = db.get_product_recipe(main_product['id'])
            
            if recipe:
                # Map products by ID for faster lookups
                prod_map = {p['id']: p for p in all_products}
                
                # Extract only the date part (YYYY-MM-DD) for stock history grouping
                # If sale.date is "2026-01-14 23:50:00", history_date becomes "2026-01-14"
                history_date = None
                if sale.date:
                    try:
                        # Handle both "T" and space separator
                        date_part = sale.date.replace('T', ' ').split(' ')[0]
                        # Validate format YYYY-MM-DD
                        datetime.strptime(date_part, '%Y-%m-%d')
                        history_date = date_part
                    except:
                        history_date = date.today().isoformat()
                
                for ing_id, qty_per_unit in recipe.items():
                    if ing_id in prod_map:
                        total_to_deduct = qty_per_unit * sale.quantite
                        
                        # Update stock history and product quantity
                        # Pass qty_start=0 so add_stock_entry fetches current stock automatically
                        db.add_stock_entry(
                            product_id=ing_id,
                            qty_start=0,  # Let the function fetch current stock
                            qty_in=0,
                            qty_out=total_to_deduct,
                            notes=f"Vente: {sale.produit_nom} (x{sale.quantite})",
                            entry_date=history_date
                        )
        
        asyncio.create_task(perform_stock_check_and_notify())
        
        # Invalidate cache
        global_cache.clear()
        
        return new_sale
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sales")
async def get_sales(limit: int = 50):
    try:
        return db.get_recent_sales(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales-summary")
async def get_sales_summary(days: int = 30):
    try:
        return db.get_sales_summary(days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset-transactions")
async def reset_transactions(current_user: Dict = Depends(get_current_user)):
    """Resets all sales and stock history transactions."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    try:
        db.reset_all_transactions()
        global_cache.clear()
        return {"message": "Toutes les transactions (ventes et historique de stock) ont été réinitialisées."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sales/{sale_id}")
async def delete_sale(sale_id: int, current_user: Dict = Depends(get_current_user)):
    """Deletes a specific sale entry by ID."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    try:
        success = db.delete_sale_entry(sale_id)
        if not success:
            raise HTTPException(status_code=404, detail="Vente non trouvée")
        return {"message": f"Vente avec ID {sale_id} supprimée avec succès."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/stock-history/{entry_id}")
async def delete_stock_history(entry_id: int, current_user: Dict = Depends(get_current_user)):
    """Deletes a specific stock history entry by ID."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    try:
        success = db.delete_stock_history_entry(entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Entrée d'historique de stock non trouvée")
        return {"message": f"Entrée d'historique de stock avec ID {entry_id} supprimée avec succès."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.delete("/delete-product/{id}")
async def delete_product_route(id: int, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    
    success = db.delete_product(id)
    if not success:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    global_cache.clear()
    print(f"Produit supprimé avec ID: {id}")
    return {"message": "Produit supprimé avec succès"}

# === STOCK HISTORY ENDPOINTS ===

class StockDailyEntry(BaseModel):
    product_id: int
    qty_start: float
    qty_in: float = 0
    qty_out: float = 0
    notes: str = ""

@app.post("/stock-daily-entry")
async def add_stock_daily_entry(entry: StockDailyEntry, current_user: Dict = Depends(get_current_user)):
    """Add or update daily stock entry for a product."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    
    result = db.add_stock_entry(
        product_id=entry.product_id,
        qty_start=entry.qty_start,
        qty_in=entry.qty_in,
        qty_out=entry.qty_out,
        notes=entry.notes
    )
    
    # Trigger alerts check after stock update
    asyncio.create_task(perform_stock_check_and_notify())
    
    return {"message": "Entrée de stock ajoutée", "entry": result}

@app.get("/stock-history/{product_id}")
async def get_stock_history(product_id: int, limit: int = 30, current_user: Dict = Depends(get_current_user)):
    """Get stock history for a product."""
    history = db.get_stock_history(product_id, limit)
    return {"product_id": product_id, "history": history}

@app.get("/stock-history-date/{date}")
async def get_stock_history_by_date(date: str, current_user: Dict = Depends(get_current_user)):
    """Get all stock entries for a specific date (format: YYYY-MM-DD)."""
    entries = db.get_all_stock_history_for_date(date)
    return {"date": date, "entries": entries}

# === ALERTS CONFIGURATION ENDPOINTS ===

class AlertsConfig(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    enabled: bool = True

@app.get("/alerts")
async def get_alerts(current_user: Dict = Depends(get_current_user)):
    """Get active low stock alerts."""
    products = db.get_all_products()
    low_stock = alerts.check_low_stock_products(products)
    return [
        {
            "ingredient_nom": p["nom"],
            "stock_actuel": p["quantite"],
            "seuil_alerte": p["seuil"],
            "unite": p.get("unite", "kg")
        }
        for p in low_stock
    ]

@app.get("/alerts/config")
async def get_alerts_config_route(current_user: Dict = Depends(get_current_user)):
    """Get current alerts configuration."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    config = db.get_alerts_config()
    return config or {"email": None, "phone": None, "enabled": False}

@app.post("/alerts/config")
async def save_alerts_config_route(config: AlertsConfig, current_user: Dict = Depends(get_current_user)):
    """Save alerts configuration (admin email/phone)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    result = db.save_alerts_config(email=config.email, phone=config.phone, enabled=config.enabled)
    return {"message": "Configuration des alertes sauvegardée", "config": result}

@app.post("/alerts/test")
async def test_alert(current_user: Dict = Depends(get_current_user)):
    """Send a test alert email."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    
    config = db.get_alerts_config()
    if not config or not config.get("email"):
        raise HTTPException(status_code=400, detail="Email non configuré")
    
    all_products = db.get_all_products()
    result = alerts.trigger_alerts_if_needed(all_products, config["email"])
    return result

@app.post("/update-target")
async def update_objectif(data: Dict[str, float], current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé - Admin requis")
    kpi_data.objectif = data.get("objectif", kpi_data.objectif)
    return {"objectif": kpi_data.objectif}

@app.get("/burger-estimation")
async def get_burger_estimation(current_user: Dict = Depends(get_current_user)):
    return {
        "ingredients": [
            {"id": 1, "name": "Bun", "quantity": 1, "unit_cost": 0.5},
            {"id": 2, "name": "Meat", "quantity": 0.15, "unit_cost": 1.2},
            {"id": 3, "name": "Cheese", "quantity": 0.05, "unit_cost": 0.8}
        ],
        "total_cost": 0.89,
        "estimated_price": 1.50
    }

@app.get("/charges-summary")
async def get_charges_summary(current_user: Dict = Depends(get_current_user)):
    return {
        "components": [
            {"id": 1, "name": "Bun", "total_quantity": 120.5, "total_cost": 60.25, "cmp_direct": 0.5},
            {"id": 2, "name": "Meat", "total_quantity": 40.0, "total_cost": 48.0, "cmp_direct": 1.2},
            {"id": 3, "name": "Cheese", "total_quantity": 80.0, "total_cost": 64.0, "cmp_direct": 0.8}
        ],
        "indirect_charges": 500.0,
        "total_cmp": 1.85
    }

@app.get("/monthly-summary/{year}/{month}")
async def get_monthly_summary(year: int, month: int, current_user: Dict = Depends(get_current_user)):
    try:
        # Use the unified billing function that uses real sales and expenses
        bilan = db.get_bilan_by_period(year, month, "day")
        
        # Map to the format expected by the frontend (it expects 'charges' instead of 'total_charges')
        result = []
        for b in bilan:
            result.append({
                "day": b["day"],
                "revenue": b["revenue"],
                "charges": b["total_charges"],
                "profit": b["profit"]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales-monthly")
async def get_monthly_sales_route(year: int, month: int, current_user: Dict = Depends(get_current_user)):
    return db.get_sales_by_month(year, month)

# === EXPENSES ENDPOINTS ===

@app.get("/expenses/{year}/{month}")
async def get_expenses_route(year: int, month: int, current_user: Dict = Depends(get_current_user)):
    return db.get_expenses_by_month(year, month)


@app.post("/expenses")
async def add_expense_route(expense: Dict = Body(...), current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
         raise HTTPException(status_code=403, detail="Admin requis")
    
    res = db.add_expense(
        nom=expense["nom"],
        type_charge=expense["type"],
        montant=expense["montant"],
        date_charge=expense["date"],
        recurrence=expense.get("recurrence", "AUCUNE")
    )
    global_cache.clear()
    return res

@app.delete("/expenses/{id}")
async def delete_expense_route(id: int, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
         raise HTTPException(status_code=403, detail="Admin requis")
    if db.delete_expense(id):
        global_cache.clear()
        return {"message": "Dépense supprimée"}
    raise HTTPException(status_code=404, detail="Dépense introuvable")


# === INGREDIENT PURCHASES ENDPOINTS ===

@app.post("/ingredient-purchases")
async def add_ingredient_purchase_route(
    purchase_data: Dict = Body(...), 
    current_user: Dict = Depends(get_current_user)
):
    """Record an ingredient purchase and update stock."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    try:
        result = db.add_ingredient_purchase(
            product_id=purchase_data["product_id"],
            quantity=purchase_data["quantity"],
            prix_achat=purchase_data["prix_achat"],
            date_achat=purchase_data.get("date")
        )
        return {"message": "Achat enregistré avec succès", "purchase": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ingredient-purchases")
async def get_ingredient_purchases_route(
    product_id: int = None, 
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get ingredient purchase history."""
    try:
        purchases = db.get_ingredient_purchases(product_id, limit)
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === PERIOD-BASED QUERIES ENDPOINTS ===

@app.get("/charges-by-period")
async def get_charges_by_period_route(
    year: int,
    month: int,
    period_type: str = "month",
    current_user: Dict = Depends(get_current_user)
):
    """Get charges aggregated by period (day or month)."""
    try:
        charges = db.get_charges_by_period(year, month, period_type)
        return charges
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sales-by-period")
async def get_sales_by_period_route(
    year: int,
    month: int,
    period_type: str = "month",
    current_user: Dict = Depends(get_current_user)
):
    """Get sales aggregated by period (day or month)."""
    try:
        sales = db.get_sales_by_period_custom(year, month, period_type)
        return sales
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/yearly-summary/{year}")
async def get_yearly_summary(year: int, current_user: Dict = Depends(get_current_user)):
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # 1. Get Revenue by month from sales table
    cursor.execute("""
        SELECT 
            CAST(strftime('%m', date) AS INTEGER) as month_num,
            SUM(total) as revenue
        FROM sales
        WHERE strftime('%Y', date) = ?
        GROUP BY month_num
        ORDER BY month_num
    """, (str(year),))
    
    sales_rows = cursor.fetchall()
    sales_map = {row[0]: row[1] for row in sales_rows}
    
    # 2. Get Expenses for the whole year (includes ingredient purchases)
    cursor.execute("""
        SELECT 
            CAST(strftime('%m', date) AS INTEGER) as month_num,
            SUM(montant) as total_expenses
        FROM expenses
        WHERE strftime('%Y', date) = ?
        GROUP BY month_num
    """, (str(year),))
    
    expenses_rows = cursor.fetchall()
    expenses_map = {row[0]: row[1] for row in expenses_rows}
    
    conn.close()
    
    summary = []
    
    for m in range(1, 13):
        rev = sales_map.get(m, 0.0) or 0.0
        total_charges = expenses_map.get(m, 0.0) or 0.0
        prof = rev - total_charges
        
        summary.append({
            "month": m,
            "revenue": round(rev * 100) / 100,
            "charges": round(total_charges * 100) / 100,
            "profit": round(prof * 100) / 100
        })
    
    return summary

@app.post("/price-estimate")
async def price_estimate(
    data: dict = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    # Récupérer les ingrédients, tva, remise, marge
    ingredients = data.get("ingredients", [])
    tva = data.get("tva", 0.19)
    remise = data.get("remise", 0.0)
    marge = data.get("marge", 0.2)

    # Construire un mapping id -> coût unitaire
    id_to_cost = {p.id: p.cout_unitaire for p in products}

    # Calcul du coût HT
    cost_ht = 0.0
    for ing in ingredients:
        item_id = ing.get("item_id")
        quantity = ing.get("quantity", 0)
        unit_cost = id_to_cost.get(item_id, 0)
        cost_ht += quantity * unit_cost

    # Prix HT après remise
    price_ht_remise = cost_ht * (1 - remise)
    # Prix de vente HT (avec marge)
    price_ht_vente = price_ht_remise * (1 + marge)
    # Prix TTC estimé
    price_ttc = price_ht_vente * (1 + tva)
    # Marge réalisée (en % du prix de vente HT)
    marge_realisee = 0.0
    if price_ht_vente > 0:
        marge_realisee = (price_ht_vente - cost_ht) / price_ht_vente

    return {
        "cost_ht": cost_ht,
        "price_ttc": price_ttc,
        "marge_realisee": marge_realisee
    }

# Route de test pour vérifier l'état des produits
@app.get("/debug/products")
async def debug_products():
    return {
        "total_products": len(products),
        "products": [p.dict() for p in products]
    }

# === ROUTES ANALYTICS & BUSINESS INTELLIGENCE ===

# @app.get("/analytics/kpis/advanced", response_model=KPIMetrics)
# async def get_advanced_kpis(current_user: Dict = Depends(get_current_user)):
#     """Récupère les KPIs avancés calculés avec ML"""
#     try:
#         products_data = [p.dict() for p in products]
#         # Données simulées pour les ventes
#         mock_sales_history = [
#             {"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1},
#             {"date": "2024-01-16", "revenue": 1800, "units_sold": 120, "product_id": 2},
#             {"date": "2024-01-17", "revenue": 1200, "units_sold": 80, "product_id": 3},
#         ]
#         
#         kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
#         return kpis
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors du calcul des KPIs: {str(e)}")

# @app.get("/analytics/predictions/stock", response_model=List[StockPrediction])
# async def get_stock_predictions(current_user: Dict = Depends(get_current_user)):
#     """Prédit les niveaux de stock futurs avec Machine Learning"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [
#             {"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1},
#             {"date": "2024-01-16", "revenue": 1800, "units_sold": 120, "product_id": 2},
#         ]
#         
#         predictions = analytics_service.predict_stock_levels(products_data, mock_sales_history)
#         return predictions
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la prédiction: {str(e)}")

# @app.get("/analytics/anomalies/detect", response_model=List[AnomalyAlert])
# async def detect_anomalies(current_user: Dict = Depends(get_current_user)):
#     """Détecte les anomalies dans les données de stock"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [{"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1}]
#         
#         anomalies = analytics_service.detect_anomalies(products_data, mock_sales_history)
#         return anomalies
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la détection d'anomalies: {str(e)}")

# @app.get("/analytics/pricing/recommendations", response_model=List[PriceRecommendation])
# async def get_price_recommendations(current_user: Dict = Depends(get_current_user)):
#     """Génère des recommandations de prix dynamiques"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [{"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1}]
#         
#         recommendations = analytics_service.generate_price_recommendations(products_data, mock_sales_history)
#         return recommendations
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la génération des recommandations: {str(e)}")

# @app.get("/analytics/seasonality/analysis", response_model=List[SeasonalAnalysis])
# async def analyze_seasonality(current_user: Dict = Depends(get_current_user)):
#     """Analyse les tendances saisonnières des produits"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [{"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1}]
#         
#         analysis = analytics_service.analyze_seasonality(products_data, mock_sales_history)
#         return analysis
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse saisonnière: {str(e)}")

# @app.get("/analytics/insights/business", response_model=BusinessInsights)
# async def get_business_insights(current_user: Dict = Depends(get_current_user)):
#     """Génère des insights business complets"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [{"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1}]
#         
#         kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
#         predictions = analytics_service.predict_stock_levels(products_data, mock_sales_history)
#         anomalies = analytics_service.detect_anomalies(products_data, mock_sales_history)
#         
#         insights = analytics_service.generate_business_insights(products_data, kpis, predictions, anomalies)
#         return insights
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la génération des insights: {str(e)}")

# @app.get("/analytics/powerbi/dashboard", response_model=PowerBIDashboard)
# async def create_powerbi_dashboard(current_user: Dict = Depends(get_current_user)):
#     """Crée un dashboard Power BI avec les données actuelles"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [{"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1}]
#         
#         kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
#         dashboard = powerbi_service.create_kpi_dashboard(kpis)
#         return dashboard
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la création du dashboard: {str(e)}")

# @app.get("/analytics/powerbi/realtime-kpis")
# async def get_realtime_kpis(current_user: Dict = Depends(get_current_user)):
#     """Récupère les KPIs temps réel pour Power BI"""
#     try:
#         products_data = [p.dict() for p in products]
#         mock_sales_history = [{"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1}]
#         
#         realtime_data = powerbi_service.generate_real_time_kpis(products_data, mock_sales_history)
#         return realtime_data
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des KPIs temps réel: {str(e)}")

# @app.get("/analytics/ml/models/status")
# async def get_ml_models_status(current_user: Dict = Depends(get_current_user)):
#     """Récupère le statut des modèles ML"""
#     try:
#         models = [
#             MLModel(
#                 model_id="stock_prediction_model",
#                 model_type=PredictionType.STOCK_LEVEL,
#                 accuracy=0.85,
#                 last_trained=datetime.now() - timedelta(days=7),
#                 features_used=["quantite", "cout_unitaire", "seuil", "historique_ventes"],
#                 hyperparameters={"n_estimators": 100, "random_state": 42},
#                 performance_metrics={"mae": 0.12, "r2": 0.85, "rmse": 0.15}
#             ),
#             MLModel(
#                 model_id="anomaly_detection_model",
#                 model_type=PredictionType.STOCK_LEVEL,
#                 accuracy=0.92,
#                 last_trained=datetime.now() - timedelta(days=3),
#                 features_used=["quantite", "cout_unitaire", "seuil", "ratio_stock"],
#                 hyperparameters={"contamination": 0.1, "random_state": 42},
#                 performance_metrics={"precision": 0.92, "recall": 0.88, "f1": 0.90}
#             )
#         ]
#         
#         return {
#             "models": models,
#             "total_models": len(models),
#             "last_update": datetime.now().isoformat()
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du statut des modèles: {str(e)}")

@app.get("/analytics/dashboard/overview")
async def get_analytics_overview(period: str = "30j", current_user: Dict = Depends(get_current_user)):
    """Vue d'overview complète de l'analytics avec données réelles"""
    # Hyper-Speed Cache check
    cache_key = f"analytics_overview_{period}"
    cached = global_cache.get(cache_key)
    if cached:
        return cached

    try:
        # Parse period string to days
        days_map = {
            "7j": 7,
            "30j": 30,
            "90j": 90,
            "1an": 365
        }
        days = days_map.get(period, 30)
        
        data = db.get_analytics_summary(period_days=days)
        
        # Map raw data to frontend format
        top_products = data["top_products"]
        trends = data["trends"]
        daily_sales = data["daily_sales"]
        
        # Structure compatible avec le frontend
        return {
            "kpis": {
                "total_revenue": data["kpis"]["total_revenue"],
                "total_costs": 0, # Calcul des coûts à implémenter plus tard si besoin
                "gross_profit": data["kpis"]["total_revenue"] * 0.4, # Estimation profit 40%
                "total_orders": data["kpis"]["total_orders"]
            },
            "insights": {
                "top_performing_products": [p["nom"] for p in data["top_products"]]
            },
            "anomalies": [
                {
                    "product_name": a["produit"],
                    "severity": "critical" if a["type"] == "critique" else "high",
                    "current_stock": a["quantite_actuelle"],
                    "threshold": a["seuil_minimum"]
                } for a in data["alerts"]
            ],
            # Passer les données brutes pour que le frontend puisse les utiliser
            "raw_daily_sales": data["daily_sales"],
            "raw_top_products": data["top_products"],
            "raw_trends": data["trends"],
            "predictions": [], # Pas de ML pour l'instant
            "last_update": datetime.now().isoformat()
        }
        global_cache.set(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur analytics: {str(e)}")


@app.get("/analytics/consumption")
async def get_consumption_analytics(
    period: str = "daily",
    start_date: str = None,
    end_date: str = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get consumption analytics for ingredients.
    
    Args:
        period: 'daily', 'weekly', 'monthly'
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
    
    Returns:
        List of consumption data grouped by period
    """
    try:
        data = db.get_consumption_data(period, start_date, end_date)
        return {
            "success": True,
            "period": period,
            "start_date": start_date,
            "end_date": end_date,
            "data": data
        }
    except Exception as e:
        print(f"Error in consumption analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === RECIPES CONFIGURATION ===
# Mapping: Main Product ID -> { Ingredient ID: Quantity per Unit }
# DEPRECATED: Used only for migration to DB. Use db.get_product_recipe(id) instead.
LEGACY_RECIPES = {
    5: {  # Chicken Burger
        1: 1.0,    # Bun
        15: 0.1,   # Chicken (kg)
        3: 1.0,    # Cheese
        7: 0.01,   # Pickels
        8: 0.01,   # Sweet sour sauce
        9: 0.02,   # Secret sauce
        10: 0.05,  # Ognon
        11: 0.01,  # Lben (L)
        12: 0.05,  # Flour (kg)
        13: 0.01,  # Water (L)
        14: 0.001  # Salt (kg)
    },
    6: {  # Triple Burger
        1: 1.0,    # Bun
        2: 0.21,   # Meat (3x0.07)
        3: 3.0,    # Cheese
        7: 0.01,   # Pickels
        9: 0.02,   # Secret sauce
        10: 0.015, # Ognon
        14: 0.003  # Salt
    },
    18: { # Fries regular
        16: 0.1,   # Fries (kg)
        17: 0.2,   # Oil (L)
        14: 0.003  # Salt
    },
    19: { # Quadruple
        1: 1.0,
        2: 0.28,
        3: 4.0,
        7: 0.02,
        9: 0.02,
        10: 0.02,
        14: 0.004
    },
    20: { # Tenders
        15: 0.1,   # Chicken
        12: 0.05,  # Flour
        13: 0.1,   # Water (L)
        14: 0.005, # Salt
        11: 0.01   # Lben (L)
    },
    21: { # Double
        1: 1.0,
        2: 0.14,
        3: 2.0,
        7: 0.01,
        9: 0.02,
        10: 0.01,
        14: 0.002
    },
    22: { # Regular (Single)
        1: 1.0,
        2: 0.07,
        3: 1.0,
        7: 0.01,
        9: 0.02,
        10: 0.005,
        14: 0.001
    }
}

@app.get("/sales-monthly")
async def get_monthly_sales(year: int, month: int, current_user: Dict = Depends(get_current_user)):
    """Get sales summary and detailed transactions for a specific month."""
    try:
        data = db.get_sales_by_month(year, month)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stock-prediction")
async def get_stock_prediction(current_user: Dict = Depends(get_current_user)):
    """
    Calculate max producible quantity for each recipe based on ingredient stocks.
    Respects the 'seuil' (threshold) - ingredients below threshold contribute 0 availability.
    """
    products = db.get_all_products()
    # Map products by ID for easy access
    prod_map = {p['id']: p for p in products}
    
    # Fetch average daily consumption
    avg_usage_map = db.get_average_daily_sales_by_product(days=30)
    
    predictions = []
    
    predictions = []
    
    for main_product in products:
        main_id = main_product['id']
        ingredients = db.get_product_recipe(main_id)
        
        if not ingredients:
            continue
            
        max_possible = float('inf')
        limiting_ingredient = None
        limiting_stock = 0
        limiting_required = 0
        
        # Check each ingredient
        for ing_id, required_qty in ingredients.items():
            if ing_id not in prod_map:
                continue
                
            ing = prod_map[ing_id]
            # Calculate available stock above threshold
            current_qty = ing['quantite']
            threshold = ing['seuil']
            
            available = max(0, current_qty - threshold)
            
            if required_qty > 0:
                possible = available / required_qty
                
                if possible < max_possible:
                    max_possible = possible
                    limiting_ingredient = ing['nom']
                    limiting_stock = current_qty
                    limiting_required = required_qty
        
        if max_possible == float('inf'):
            max_possible = 0
            
        # Prediction Logic
        avg_daily = avg_usage_map.get(main_product['nom'], 0.0)
        days_remaining = 999
        runout_date = "N/A"
        
        if avg_daily > 0:
            days_remaining = int(max_possible / avg_daily)
            if days_remaining < 365:
                runout_date = (date.today() + timedelta(days=days_remaining)).strftime("%Y-%m-%d")
            else:
                runout_date = "> 1 an"
            
        predictions.append({
            "product_id": main_id,
            "product_name": main_product['nom'],
            "max_possible": int(max_possible),
            "avg_daily_sales": round(avg_daily, 2),
            "days_remaining": days_remaining,
            "runout_date": runout_date,
            "limiting_ingredient": limiting_ingredient,
            "limiting_stock": limiting_stock,
            "limiting_required": limiting_required
        })
        
    return predictions

@app.get("/analytics/hourly-distribution")
async def get_hourly_sales(
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
    product_id: Optional[int] = Query(None, description="Product ID to filter by")
):
    try:
        data = db.get_hourly_sales_distribution(start_date, end_date, product_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/bilan-period")
async def get_bilan_period(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    period_type: str = Query("month", description="'day' or 'month'")
):
    try:
        data = db.get_bilan_by_period(year, month, period_type)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions")
async def get_comprehensive_predictions(current_user: Dict = Depends(get_current_user)):
    """
    Comprehensive prediction dashboard data for raw materials.
    Returns KPIs, alerts, forecasts, heatmap, and model metrics.
    """
    import prediction_model as pm
    
    # Get all products and their current stock
    products = db.get_all_products()
    prod_map = {p['id']: p for p in products}
    
    # Get sales history (last 60 days for training)
    conn = db.get_connection()
    cursor = conn.cursor()
    sixty_days_ago = (date.today() - timedelta(days=60)).strftime("%Y-%m-%d")
    
    cursor.execute("""
        SELECT date, produit_nom, quantite
        FROM sales
        WHERE date >= ?
        ORDER BY date ASC
    """, (sixty_days_ago,))
    
    sales_history = []
    product_name_to_id = {p['nom']: p['id'] for p in products}
    
    for row in cursor.fetchall():
        date_str, prod_name, qty = row
        if prod_name in product_name_to_id:
            sales_history.append((date_str, product_name_to_id[prod_name], qty))
    
    conn.close()
    
    # Generate ingredient forecasts for next 7 days
    # Build recipes dict from DB for prediction model
    all_products = db.get_all_products()
    recipes_dict = {}
    for p in all_products:
        r = db.get_product_recipe(p['id'])
        if r:
            recipes_dict[p['id']] = r
            
    ingredient_forecasts = pm.predict_ingredient_consumption(
        sales_history, recipes_dict, forecast_days=7
    )
    
    # Calculate KPIs and alerts
    alerts = []
    critical_count = 0
    urgent_count = 0
    
    ingredient_predictions = []
    
    for ing_id, daily_forecast in ingredient_forecasts.items():
        if ing_id not in prod_map:
            continue
            
        ingredient = prod_map[ing_id]
        current_stock = ingredient['quantite']
        threshold = ingredient['seuil']
        
        # Calculate cumulative consumption
        cumulative = 0
        days_until_shortage = 999
        shortage_date = "N/A"
        
        for day_idx, daily_need in enumerate(daily_forecast):
            cumulative += daily_need
            if current_stock - cumulative <= threshold:
                days_until_shortage = day_idx + 1
                shortage_date = (date.today() + timedelta(days=day_idx + 1)).strftime("%Y-%m-%d")
                break
        
        # Determine priority
        priority = "normal"
        if days_until_shortage <= 2:
            priority = "critical"
            critical_count += 1
        elif days_until_shortage <= 5:
            priority = "urgent"
            urgent_count += 1
        
        # Calculate 7-day total
        total_7day = sum(daily_forecast)
        daily_avg = total_7day / 7
        
        # Determine status
        status = "ok"
        if days_until_shortage < 5:
            status = "alert"
        elif current_stock > threshold * 3:
            status = "overstock"
        
        # Build prediction object
        ingredient_predictions.append({
            "id": ing_id,
            "name": ingredient['nom'],
            "emoji": "📦",  # Default, can be customized
            "stock_current": round(current_stock, 2),
            "predictions_7days": {
                "total": round(total_7day, 2),
                "daily_avg": round(daily_avg, 2),
                "by_day": [
                    {
                        "date": (date.today() + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                        "predicted_consumption": round(daily_forecast[i], 2),
                        "confidence": 85,  # Simplified
                        "stock_after": round(current_stock - sum(daily_forecast[:i+1]), 2)
                    }
                    for i in range(7)
                ]
            },
            "days_until_shortage": days_until_shortage,
            "model_accuracy": 85,  # Simplified for now
            "trend": "stable",
            "trend_percentage": 0,
            "status": status
        })
        
        # Create alert if needed
        if priority in ["critical", "urgent"]:
            recommended_qty = max(0, (daily_avg * 14) - current_stock + threshold)
            
            alerts.append({
                "id": f"alert-{ing_id}",
                "priority": priority,
                "product_id": ing_id,
                "product_name": ingredient['nom'],
                "stock_current": round(current_stock, 2),
                "stock_needed": round(total_7day, 2),
                "days_until_shortage": days_until_shortage,
                "shortage_date": shortage_date,
                "recommendation": {
                    "action": "order",
                    "quantity": round(recommended_qty, 2),
                    "deadline": (date.today() + timedelta(days=max(0, days_until_shortage-1))).strftime("%Y-%m-%d"),
                    "supplier": "Fournisseur Principal",
                    "cost": round(recommended_qty * 5, 2)  # Placeholder cost
                }
            })
    
    # Get heatmap data
    heatmap = db.get_hourly_sales_heatmap(days=30)
    
    # Calculate summary KPIs
    summary = {
        "model_accuracy": 85,  # Simplified
        "active_alerts": len(alerts),
        "critical_alerts": critical_count,
        "estimated_savings": 1240,  # Placeholder
        "pending_orders": 0  # Placeholder
    }
    
    # Model metrics
    model_metrics = {
        "global_accuracy": 85,
        "mae": 3.2,
        "last_update": date.today().strftime("%Y-%m-%d 06:00:00"),
        "training_frequency": "weekly",
        "data_days": 60,
        "by_product": [
            {
                "product_id": pred["id"],
                "product_name": pred["name"],
                "accuracy": pred["model_accuracy"],
                "mae": 3.5,
                "confidence": "high" if pred["model_accuracy"] >= 80 else "medium"
            }
            for pred in ingredient_predictions[:5]  # Top 5
        ]
    }
    
    return {
        "summary": summary,
        "alerts": sorted(alerts, key=lambda x: x["days_until_shortage"]),
        "products": sorted(ingredient_predictions, key=lambda x: x["days_until_shortage"]),
        "heatmap": heatmap,
        "model_metrics": model_metrics
    }

# =========== SETTINGS & NOTIFICATIONS ===========

from notification_service import notification_service
import asyncio
from datetime import datetime as dt

@app.get("/settings")
async def get_settings_endpoint(current_user: Dict = Depends(get_current_user)):
    """Get notification settings."""
    settings = db.get_settings()
    return settings

@app.post("/settings")
async def update_settings_endpoint(
    settings_data: Dict = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """Update notification settings."""
    phone_number = settings_data.get('phone_number')
    notifications_enabled = settings_data.get('notifications_enabled', 1)
    email = settings_data.get('email')
    email_notifications_enabled = settings_data.get('email_notifications_enabled', 1)
    notification_frequency = settings_data.get('notification_frequency', 'immediate')
    
    updated = db.update_settings(
        phone_number=phone_number, 
        notifications_enabled=notifications_enabled,
        email=email,
        email_notifications_enabled=email_notifications_enabled,
        notification_frequency=notification_frequency
    )
    return updated

@app.get("/notifications/history")
async def get_notification_history_endpoint(
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get notification history."""
    history = db.get_notification_history(limit)
    return history

@app.post("/notifications/test-email")
async def test_email_notification(current_user: Dict = Depends(get_current_user)):
    """Send a test email notification."""
    settings = db.get_settings()
    email = settings.get('email')
    
    if not email:
        raise HTTPException(status_code=400, detail="Aucun email configuré")
    
    email_data = notification_service.format_stock_email(
        ingredient_name="Meat",
        current_stock=8.5,
        threshold=10.0,
        days_remaining=1
    )
    
    # Make subject more aggressive for mobile notifications
    subject = f"🚨🚨🚨 URGENT : RUPTURE DE STOCK (Meat) !!! 🚨🚨🚨"
    
    result = notification_service.send_email(email, subject, email_data['html'])
    
    if result['status'] == 'sent':
        db.add_notification_history(
            ingredient_name="Meat",
            ingredient_id=2,
            stock_level=8.5,
            threshold=10.0,
            message=f"Email de test (Simulé) envoyé avec priorité Haute à {email}",
            status="sent"
        )
        return {"message": "Email de test envoyé avec succès", "details": result}
    else:
        return {"message": "Erreur lors de l'envoi de l'email", "details": result}

async def perform_stock_check_and_notify():
    """Core logic to check stock levels and send notifications."""
    try:
        settings = db.get_settings()
        
        if not settings.get('notifications_enabled') and not settings.get('email_notifications_enabled'):
            return
        
        if not settings.get('phone_number') and not settings.get('email'):
            return
        
        # Get all products
        products = db.get_all_products()
        avg_sales = db.get_average_daily_sales_by_product()
        
        for product in products:
            stock = product['quantite']
            threshold = product['seuil']
            
            # Check if stock is below threshold
            if stock <= threshold:
                # Calculate days remaining (simple estimation)
                avg_daily = avg_sales.get(product['id'], 0)
                if stock <= 0:
                    days_remaining = 0
                else:
                    days_remaining = int(stock / avg_daily) if avg_daily > 0 else 999
                
                # Check cooldown based on history
                conn = db.get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT sent_at FROM notification_history WHERE ingredient_id = ? AND status = 'sent' ORDER BY sent_at DESC LIMIT 1",
                    (product['id'],)
                )
                last_alert = cursor.fetchone()
                conn.close()
                
                should_send = True
                now = dt.now()
                
                if last_alert:
                    last_alert_dt = dt.fromisoformat(last_alert[0])
                    elapsed_seconds = (now - last_alert_dt).total_seconds()
                    
                    freq = settings.get('notification_frequency', 'immediate')
                    if freq == 'immediate' and elapsed_seconds < 21600:  # 6 hours
                        should_send = False
                    elif freq == 'daily' and elapsed_seconds < 86400:    # 24 hours
                        should_send = False
                    elif freq == 'weekly' and elapsed_seconds < 604800:  # 7 days
                        should_send = False
                
                if should_send:
                    sms_success = False
                    email_sent = False
                    
                    # 1. Attempt SMS first
                    if settings.get('notifications_enabled') and settings.get('phone_number'):
                        message = notification_service.format_stock_alert(
                            product['nom'], stock, threshold, days_remaining
                        )
                        result_sms = notification_service.send_sms(settings['phone_number'], message)
                        
                        db.add_notification_history(
                            ingredient_name=product['nom'],
                            ingredient_id=product['id'],
                            stock_level=stock,
                            threshold=threshold,
                            message=message,
                            status=result_sms['status']
                        )
                        
                        if result_sms['status'] == 'sent':
                            sms_success = True

                    # 2. Fallback to Email if SMS disabled, failed, or just as dual-channel
                    # If SMS failed or was not sent, we DEFINITELY want email
                    # If user has both enabled, they might want both. 
                    # But per user request: "if quota reached with phone, then email!"
                    
                    should_send_email = settings.get('email_notifications_enabled') and settings.get('email')
                    
                    if should_send_email:
                        # We send email if:
                        # a) SMS was not attempted/enabled
                        # b) SMS failed
                        # c) Or always (dual channel) - the user seems to want a guarantee.
                        # Since user said "if quota is reached... then email", I'll prioritize email as backup.
                        
                        email_data = notification_service.format_stock_email(
                            product['nom'], stock, threshold, days_remaining
                        )
                        
                        # Add a note if it's a failover
                        subject = email_data['subject']
                        if not sms_success and settings.get('notifications_enabled'):
                            subject = f"⚠️ FAILOVER: {subject}"

                        result_email = notification_service.send_email(
                            settings['email'], subject, email_data['html']
                        )
                        
                        db.add_notification_history(
                            ingredient_name=product['nom'],
                            ingredient_id=product['id'],
                            stock_level=stock,
                            threshold=threshold,
                            message=f"Email ({'Backup' if not sms_success else 'Principal'}): {subject}",
                            status=result_email['status']
                        )
                    
                    # Update global last sent
                    db.update_settings(
                        phone_number=settings['phone_number'],
                        notifications_enabled=settings['notifications_enabled'],
                        email=settings['email'],
                        email_notifications_enabled=settings['email_notifications_enabled'],
                        notification_frequency=settings['notification_frequency']
                    )
    except Exception as e:
        print(f"⚠️ Error in stock check: {e}")

# Background task wrapper
async def check_stock_and_notify_task():
    """Background task that runs every hour to check stock levels."""
    while True:
        await perform_stock_check_and_notify()
        await asyncio.sleep(3600)  # Sleep 1 hour


@app.on_event("startup")
async def startup():
    try:
        db.init_database()
        db.migrate_initial_data(_initial_products)
        db.migrate_product_display_names()
        db.delete_salade()
        db.migrate_main_product_prices()
        
        # New migrations
        db.migrate_recipes_from_dict(LEGACY_RECIPES)
        db.enforce_ingredient_units()
        
        print("✅ Base de données initialisée et migrée au démarrage.")
        
        # Start background stock monitoring task
        asyncio.create_task(check_stock_and_notify_task())
        print("📱 Tâche de surveillance des stocks démarrée")
    except Exception as e:
        print(f"⚠️ Erreur initialisation base de données: {e}")

@app.post("/global-reset")
async def global_reset(current_user: Dict = Depends(get_current_user)):
    """
    Reset all transaction data (sales, stock history, expenses) and zero out stock.
    Requires authentication.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    success = db.reset_all_transactions()
    if success:
        return {"message": "All data has been reset successfully."}
    else:
        raise HTTPException(status_code=500, detail="Failed to reset data.")

# === INVOICE MANAGEMENT ===

@app.post("/invoices/upload")
async def upload_invoice(file: UploadFile = File(...), current_user: Dict = Depends(get_current_user)):
    """Upload an invoice, run OCR, and save to DB."""
    try:
        # 1. Save file
        file_path = os.path.join("uploads", file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Extract Text (now returns a dict with coordinates)
        text_data = ""
        if file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            text_data = await ocr_service.extract_text_from_image(file_path)
        elif file.filename.lower().endswith('.pdf'):
            text_data = await ocr_service.extract_text_from_pdf(file_path)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté (PNG, JPG, PDF uniquement)")
        
        # 3. Parse Data
        parsed_data = ocr_service.parse_invoice_data(text_data)
        
        # Get raw text for storage/logging
        text = text_data.get("text", "") if isinstance(text_data, dict) else text_data
        
        print(f"DEBUG: OCR Raw Text extracted: {text[:500]}...") # Log first 500 chars
        print(f"DEBUG: Parsed Invoice Data: {parsed_data}")

        
        # 4. AUTO-MAPPING: Find product_id for each parsed item
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom FROM products WHERE type IN ('ING', 'PREP')")
        all_products = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Create mapping dictionary for common translations
        name_mappings = {
            # English -> French
            "oil": "huile", "flour": "farine", "cheese": "fromage",
            "meat": "viande", "onion": "oignon", "potato": "pomme de terre",
            "chicken": "poulet", "milk": "lait", "egg": "oeuf",
            "bread": "pain", "tomato": "tomate", "lettuce": "laitue",
            # French variations
            "viande": "viande", "oignon": "oignon", "pomme de terre": "pomme de terre",
            "huile": "huile", "farine": "farine", "fromage": "fromage"
        }
        
        for item in parsed_data.get("items", []):
            product_name_lower = item["name"].lower().strip()
            matched_id = None
            
            # Step 1: Try exact match with normalized name
            normalized_name = name_mappings.get(product_name_lower, product_name_lower)
            for prod in all_products:
                if normalized_name in prod["nom"].lower():
                    matched_id = prod["id"]
                    item["product_id"] = matched_id
                    item["product_name"] = prod["nom"]
                    print(f"  ✅ Auto-mapped '{item['name']}' → {prod['nom']} (ID: {matched_id})")
                    break
            
            if not matched_id:
                # Step 2: Try fuzzy match on original name
                for prod in all_products:
                    if product_name_lower in prod["nom"].lower() or prod["nom"].lower() in product_name_lower:
                        matched_id = prod["id"]
                        item["product_id"] = matched_id
                        item["product_name"] = prod["nom"]
                        print(f"  ✅ Auto-mapped (fuzzy) '{item['name']}' → {prod['nom']} (ID: {matched_id})")
                        break
            
            if not matched_id:
                print(f"  ⚠️  No match found for '{item['name']}' - user will need to map manually")
                item["product_id"] = None
        
        # 5. Create Invoice Record
        conn = db.get_connection()
        cursor = conn.cursor()

        # Save to Database (Status: confirmed)
        supplier = parsed_data.get("supplier_name") or "Inconnu"
        total_amt = parsed_data.get("total_amount") or 0
        inv_date = parsed_data.get("invoice_date") or date.today().isoformat()
        
        cursor.execute("""
            INSERT INTO invoices (date_upload, filename, supplier_name, total_amount, invoice_date, status, ocr_raw_text, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            file.filename,
            supplier,
            total_amt,
            inv_date,
            'confirmed',
            text,
            f"/uploads/{file.filename}"
        ))
        invoice_id = cursor.lastrowid

        # 5. Create Detailed Expenses per Item (as requested by user)
        inv_date = parsed_data.get("invoice_date") or date.today().isoformat()
        supplier = parsed_data.get("supplier_name") or "Inconnu"
        
        # Mapping translation for French/Arabic -> English stock names
        translations = {
            "viande": "Meat", "meat": "Meat", "لحم": "Meat", "viande (meat)": "Meat",
            "ognon": "Ognon", "oignon": "Ognon", "onion": "Ognon", "onions": "Ognon", "بصل": "Ognon",
            "potato": "Fries", "pomme": "Fries", "pomme de terre": "Fries", "بطاطا": "Fries", "potatoe": "Fries", "frie": "Fries", "chips": "Fries",

            "tomato": "Tomato", "طماطم": "Tomato",
            "poulet": "Chicken", "chicken": "Chicken", "دجاج": "Chicken",
            "huile": "Oil", "oil": "Oil", "زيت": "Oil",
            "lait": "Milk", "milk": "Milk", "حليب": "Milk",
            "oeuf": "Egg", "egg": "Egg", "بيض": "Egg", "oeufs": "Egg",
            "cheese": "Cheese", "fromage": "Cheese", "جبن": "Cheese"
        }


        # 6. Save Items, Update Stock and Create Expenses
        all_db_products = db.get_all_products()
        
        for item in parsed_data["items"]:
            # A. Refine Mapping with Translation
            raw_name = item["name"].lower().strip('() :;,-')
            # Translate if known
            translated_name = raw_name
            # Priority exact matches first
            for key, val in translations.items():
                if key == raw_name or f" {key} " in f" {raw_name} ":
                    translated_name = val
                    break
            else:
                # Substring match if no exact match
                for key, val in translations.items():
                    if key in raw_name or raw_name in key:
                        translated_name = val
                        break
            
            item_words = set(re.findall(r'\w+', translated_name))
            
            matched_id = None
            t_lower = translated_name.lower().strip()
            print(f"DEBUG MAPPING: Raw Item='{item['name']}' -> Translated='{t_lower}'")
            
            for p in all_db_products:
                p_nom = p["nom"].lower().strip()
                p_words = set(re.findall(r'\w+', p_nom))
                
                # Check 1: Direct match (Case-Insensitive)
                if p_nom == t_lower or p_nom in t_lower or t_lower in p_nom:
                    matched_id = p["id"]
                    print(f"  ✅ MATCH FOUND: '{item['name']}' -> DB Product '{p['nom']}' (ID {matched_id})")
                    break
                
                # Check 2: Word intersection (significant words > 3 chars)
                common_words = item_words.intersection(p_words)
                significant_words = [w for w in common_words if len(w) > 3]
                if significant_words:
                    matched_id = p["id"]
                    print(f"  ✅ WORD MATCH: '{item['name']}' -> DB Product '{p['nom']}' (ID {matched_id}) via {significant_words}")
                    break
            
            if not matched_id:
                print(f"  ❌ NO MATCH for '{item['name']}' (Translated: {t_lower})")
            
            item["product_id"] = matched_id
            
            # B. Save line item in invoice_items
            cursor.execute("""
                INSERT INTO invoice_items (invoice_id, product_id, product_name, quantite, prix_unitaire, total)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                invoice_id,
                matched_id,
                item["name"],
                item["quantity"],
                item["unit_price"],
                item["total"]
            ))

            # C. Create Expense per line item manually
            item_total = item["total"] or 0
            cursor.execute("""
                INSERT INTO expenses (nom, type, montant, date, recurrence, invoice_id, quantite, unite)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item['name'], # Clean name: just the product
                'INGREDIENT_PURCHASE', # Correct type
                item_total,
                inv_date,
                'AUCUNE',
                invoice_id,
                item["quantity"],
                'unité' if 'cheese' in item['name'].lower() or 'pain' in item['name'].lower() or 'bun' in item['name'].lower() else 'kg'
            ))

            
            # D. Update stock if matched
            if matched_id:
                try:
                    db.add_stock_entry(
                        product_id=matched_id,
                        qty_start=0,
                        qty_in=item["quantity"],
                        qty_out=0,
                        notes=f"Auto-Stock (Facture: {supplier})",
                        cursor=cursor
                    )
                except Exception as ex:
                    print(f"Failed to auto-update stock for {item['name']}: {ex}")

            
        conn.commit()
        conn.close()
        
        return {
            "id": invoice_id,
            "filename": file.filename,
            "extracted_data": parsed_data,
            "ocr_raw_text": text,
            "status": "confirmed",
            "image_path": f"/uploads/{file.filename}"
        }

    except Exception as e:
        print(f"Error in upload_invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/invoices")
async def get_invoices(status: Optional[str] = None, current_user: Dict = Depends(get_current_user)):
    """List all invoices."""
    conn = db.get_connection()
    query = "SELECT * FROM invoices"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY id DESC"
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/invoices/{invoice_id}/confirm")
async def confirm_invoice(invoice_id: int, data: Dict = Body(...), current_user: Dict = Depends(get_current_user)):
    """
    Validate invoice data and create an expense.
    Request body: { "supplier_name": str, "total_amount": float, "date": str, "items": list }
    """
    print(f"\n[OPTIMIZED] CONFIRMING INVOICE {invoice_id}")
    print(f"Data: {data}")
    try:

        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 0. Delete previous granular expenses for this invoice (to avoid duplicates on retry)
        cursor.execute("DELETE FROM expenses WHERE invoice_id = ?", (invoice_id,))
        
        # 1. Update invoice status & data
        # Note: We now store total_amount directly in invoices, but the source of truth for dashboard totals 
        # is the SUM of granular expenses.
        cursor.execute("""
            UPDATE invoices 
            SET status = 'confirmed', supplier_name = ?, total_amount = ?, invoice_date = ?
            WHERE id = ?
        """, (data['supplier_name'], data['total_amount'], data['date'], invoice_id))
        
        # 2. Get old items to calculate deltas (to avoid double counting on re-confirmation)
        cursor.execute("SELECT product_id, quantite FROM invoice_items WHERE invoice_id = ?", (invoice_id,))
        old_qtys = {}
        for row in cursor.fetchall():
            r = dict(row)
            pid = r.get("product_id")
            if pid:
                old_qtys[pid] = old_qtys.get(pid, 0) + (r.get("quantite") or 0)

        # 3. Update line items and Create Granular Expenses
        cursor.execute("DELETE FROM invoice_items WHERE invoice_id = ?", (invoice_id,))
        items = data.get("items", [])
        new_qtys = {}
        
        for item in items:
            pid = item.get("product_id")
            qty = item.get("quantity", 0)
            item_total = item.get("total", 0)
            item_name = item.get("product_name") or item.get("name")
            
            if pid:
                new_qtys[pid] = new_qtys.get(pid, 0) + qty
                
            # A. Save Item
            cursor.execute("""
                INSERT INTO invoice_items (invoice_id, product_id, product_name, quantite, prix_unitaire, total)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (invoice_id, pid, item_name, qty, item.get("unit_price", 0), item_total))
            
            # B. Create Individual Expense (as requested)
            cursor.execute("""
                INSERT INTO expenses (nom, type, montant, date, recurrence, invoice_id, quantite, unite)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item_name, # Clean name
                'INGREDIENT_PURCHASE', # Correct type
                item_total, 
                data['date'], 
                'AUCUNE', 
                invoice_id,
                qty,
                'unité' if 'cheese' in item_name.lower() or 'pain' in item_name.lower() or 'bun' in item_name.lower() else 'kg'
            ))

        # 4. Update stock with DELTAS (Directly using shared cursor for speed)
        # Merge all PIDs from old and new
        all_pids = set(list(old_qtys.keys()) + list(new_qtys.keys()))
        print(f"\n--- STOCK UPDATE PHASE (Optimized) ---")
        
        for pid in all_pids:
            old_qty = old_qtys.get(pid, 0)
            new_qty = new_qtys.get(pid, 0)
            delta = new_qty - old_qty
            
            if delta != 0:
                print(f"  → Updating stock for PID {pid}: delta={delta}")
                db.add_stock_entry(
                    product_id=pid,
                    qty_start=0, 
                    qty_in=delta,
                    qty_out=0,
                    notes=f"Sync Facture (id:{invoice_id}): {data['supplier_name']}",
                    cursor=cursor
                )
        
        # 5. Final Commit (Single transaction for everything)
        conn.commit()
        conn.close()
        print("✅ Invoice confirmation and stock synchronization complete.")
        
        return {"status": "success", "message": "Facture confirmée, dépenses et stocks mis à jour."}

    except Exception as e:
        if 'conn' in locals():
            try: conn.rollback()
            except: pass
            try: conn.close()
            except: pass
        print(f"❌ Error in confirm_invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/invoices/{invoice_id}/items")
async def get_invoice_items(invoice_id: int, current_user: Dict = Depends(get_current_user)):
    """Get line items for a specific invoice."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM invoice_items WHERE invoice_id = ?", (invoice_id,))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: int, current_user: Dict = Depends(get_current_user)):
    """Delete an invoice and its associated file."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get info to delete file
        cursor.execute("SELECT filename FROM invoices WHERE id = ?", (invoice_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Facture non trouvée")
        
        filename = row['filename']
        
        # Delete from DB
        cursor.execute("DELETE FROM invoices WHERE id = ?", (invoice_id,))
        conn.commit()
        conn.close()
        
        # Delete file if exists
        file_path = os.path.join("uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"success": True, "message": "Facture supprimée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/invoices/{invoice_id}")
async def update_invoice(invoice_id: int, data: Dict = Body(...), current_user: Dict = Depends(get_current_user)):
    """Update invoice metadata before confirmation."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE invoices 
            SET supplier_name = ?, total_amount = ?, invoice_date = ?
            WHERE id = ?
        """, (data.get('supplier_name'), data.get('total_amount'), data.get('date'), invoice_id))
        
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
 