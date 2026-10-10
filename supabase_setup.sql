-- Drop existing policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Public Read" ON products;
DROP POLICY IF EXISTS "Public Insert" ON products;
DROP POLICY IF EXISTS "Public Update" ON products;
DROP POLICY IF EXISTS "Public Delete" ON products;

DROP POLICY IF EXISTS "Public Read Recipes" ON recipes;
DROP POLICY IF EXISTS "Public Insert Recipes" ON recipes;
DROP POLICY IF EXISTS "Public Update Recipes" ON recipes;
DROP POLICY IF EXISTS "Public Delete Recipes" ON recipes;

DROP POLICY IF EXISTS "Public Read Sales" ON sales;
DROP POLICY IF EXISTS "Public Insert Sales" ON sales;

DROP POLICY IF EXISTS "Public Read Expenses" ON expenses;
DROP POLICY IF EXISTS "Public Insert Expenses" ON expenses;

-- Création des Tables
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    quantite NUMERIC DEFAULT 0,
    cout_unitaire NUMERIC DEFAULT 0,
    seuil NUMERIC DEFAULT 50,
    categorie TEXT DEFAULT 'Ingredient',
    fournisseur TEXT DEFAULT '',
    date_peremption TEXT,
    unite TEXT DEFAULT 'kg',
    type TEXT DEFAULT 'ING',
    image_url TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    produit_nom TEXT NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    type TEXT NOT NULL,
    montant NUMERIC NOT NULL,
    date TEXT NOT NULL,
    recurrence TEXT DEFAULT 'AUCUNE',
    quantite NUMERIC DEFAULT NULL,
    unite TEXT DEFAULT NULL
);

-- Sécurité et accès public
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read" ON products FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON products FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON products FOR DELETE USING (true);

CREATE POLICY "Public Read Recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Public Insert Recipes" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Recipes" ON recipes FOR UPDATE USING (true);

-- Insertion automatique de vos données actuelles
INSERT INTO products (id, nom, quantite, cout_unitaire, seuil, categorie, fournisseur, unite, type) VALUES
(1, 'Bun', 100, 0.5, 100.0, 'Ingredient', 'Boulangerie', 'unité', 'PREP'),
(2, 'Meat', 3.53, 1.5, 10.0, 'Ingredient', 'Boucherie', 'kg', 'ING'),
(3, 'Cheese', 12.0, 2.0, 10.0, 'Ingredient', 'Fromagerie', 'unité', 'ING'),
(5, 'CHICKEN (بودجاج)', 150.0, 12.5, 30.0, 'Main Product', 'Cuisine', 'kg', 'PRODUCT'),
(6, 'TRIPLE (بوثلاثة)', 100.0, 18.5, 20.0, 'Main Product', 'Cuisine', 'kg', 'PRODUCT'),
(7, 'Pickels', 5.0, 5.0, 10.0, 'Ingredient', '', 'kg', 'PREP'),
(8, 'Sweet sour sauce', 5.0, 8.0, 10.0, 'Ingredient', '', 'kg', 'PREP'),
(9, 'Secret sauce', 5.0, 10.0, 10.0, 'Ingredient', '', 'kg', 'PREP'),
(10, 'Ognon', 19.95, 1.2, 10.0, 'Ingredient', '', 'kg', 'ING'),
(15, 'Chicken', 14.8, 10.0, 10.0, 'Ingredient', '', 'kg', 'ING'),
(16, 'Fries', 26.9, 3.5, 10.0, 'Ingredient', '', 'kg', 'ING'),
(18, 'JUST FRIES (Fries Regular)', 100.0, 5.5, 20.0, 'Main Product', 'Cuisine', 'unité', 'PRODUCT')
ON CONFLICT (id) DO NOTHING;
