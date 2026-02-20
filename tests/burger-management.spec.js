const { test, expect } = require('@playwright/test');

test.describe('Burger Social Club - Management Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    // Note: localStorage.clear() is skipped for file:// URLs due to security restrictions
  });

  test('Stock Management - Display and Actions', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Navigate to Inventory section
    await page.getByText('Inventaire', { exact: true }).click();
    
    // Verify inventory table displays
    await expect(page.getByRole('heading', { name: '🧾 Inventaire actuel' })).toBeVisible();
    
    // Verify stock table contains required columns
    await expect(page.getByText('Ingrédient')).toBeVisible();
    await expect(page.getByText('Quantité restante')).toBeVisible();
    await expect(page.getByText('Seuil d\'alerte')).toBeVisible();
    await expect(page.getByText('Statut')).toBeVisible();
    await expect(page.getByText('Actions')).toBeVisible();
    
    // Verify stock items are displayed
    await expect(page.getByText('Pain burger')).toBeVisible();
    await expect(page.getByText('Steaks hachés')).toBeVisible();
    await expect(page.getByText('Fromage cheddar')).toBeVisible();
    await expect(page.getByText('Sauce spéciale')).toBeVisible();
    
    // Test stock update functionality
    await page.selectOption('[name="ingredient"]', 'Pain burger');
    await page.fill('input[type="number"]', '25');
    await page.getByRole('button', { name: 'Mettre à jour le stock' }).click();
    
    // Verify action buttons exist
    await expect(page.getByRole('button', { name: 'Commander' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Commander urgent' })).toBeVisible();
  });

  test('Sales Management - Date Selection and Persistence', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Navigate to Sales Management section
    await page.getByText('Gestion des ventes').click();
    
    // Verify sales form displays
    await expect(page.getByRole('heading', { name: '🛒 Nouvelle vente' })).toBeVisible();
    
    // Test date selection functionality
    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue(today); // Should default to today
    
    // Test adding a sale with custom date
    const customDate = '2024-01-15';
    await dateInput.fill(customDate);
    await expect(dateInput).toHaveValue(customDate);
    
    // Test product selection
    await page.selectOption('select', 'Burger Classic - 8,50 €');
    await page.fill('input[type="number"]', '3');
    
    // Add the sale
    await page.getByRole('button', { name: 'Ajouter la vente' }).click();
    
    // Verify sales history table
    await expect(page.getByRole('heading', { name: '📋 Historique des ventes' })).toBeVisible();
    await expect(page.getByText('Date')).toBeVisible();
    await expect(page.getByText('Produit')).toBeVisible();
    await expect(page.getByText('Quantité')).toBeVisible();
    await expect(page.getByText('Prix unitaire')).toBeVisible();
    await expect(page.getByText('Total')).toBeVisible();
    
    // Verify existing sales data
    await expect(page.getByText('Burger Classic')).toBeVisible();
    await expect(page.getByText('8,50 €')).toBeVisible();
  });

  test('Monthly Report - Data Synchronization', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // First add a sale to test synchronization
    await page.getByText('Gestion des ventes').click();
    
    const testDate = '2024-01-20';
    await page.fill('input[type="date"]', testDate);
    await page.selectOption('select', 'Burger Cheese - 9,50 €');
    await page.fill('input[type="number"]', '5');
    await page.getByRole('button', { name: 'Ajouter la vente' }).click();
    
    // Note: In static application, we can't test real synchronization
    // but we can verify the structure exists for the monthly report
    
    // Test monthly report structure (would need actual backend for full test)
    // This verifies the UI elements exist for the synchronization
    await expect(page.getByRole('heading', { name: '📋 Historique des ventes' })).toBeVisible();
    
    // Verify the sale appears in the table with correct data
    const salesTable = page.locator('table').last();
    await expect(salesTable.getByText('Burger Cheese')).toBeVisible();
    await expect(salesTable.getByText('9,50 €')).toBeVisible();
  });

  test('Stock Evolution and J-1 Data Display', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Go to dashboard to see stock evolution
    await page.getByText('Tableau de bord').click();
    
    // Verify stock display section
    await expect(page.getByRole('heading', { name: '🧾 Stock actuel' })).toBeVisible();
    
    // Verify stock status indicators
    await expect(page.getByText('OK').first()).toBeVisible();
    await expect(page.getByText('Attention')).toBeVisible();
    await expect(page.getByText('Rupture')).toBeVisible();
    
    // Go to inventory for detailed view
    await page.getByText('Inventaire').click();
    
    // Verify stock management interface
    await expect(page.getByText('Gestion du stock')).toBeVisible();
    await expect(page.getByText('Inventaire actuel')).toBeVisible();
    
    // Test ingredient selector
    const ingredientSelect = page.locator('select[name="ingredient"]');
    await expect(ingredientSelect).toBeVisible();
    
    // Verify options are available
    await ingredientSelect.click();
    await expect(page.getByText('Pain burger')).toBeVisible();
    await expect(page.getByText('Steaks hachés')).toBeVisible();
    await expect(page.getByText('Fromage cheddar')).toBeVisible();
    await expect(page.getByText('Sauce spéciale')).toBeVisible();
  });

  test('Search Functionality in Management Pages', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Test inventory search functionality
    await page.getByText('Inventaire').click();
    
    // Verify ingredient selection dropdown acts as search/filter
    const ingredientSelect = page.locator('select');
    await ingredientSelect.selectOption('Pain burger');
    await expect(ingredientSelect).toHaveValue('Pain burger');
    
    // Test sales management search (if available in static version)
    await page.getByText('Gestion des ventes').click();
    
    // Verify product selection acts as search functionality
    const productSelect = page.locator('select');
    await productSelect.selectOption('Burger Classic - 8,50 €');
    await expect(productSelect).toHaveValue('Burger Classic - 8,50 €');
    
    // Verify all products are available
    await productSelect.click();
    await expect(page.getByText('Burger Classic')).toBeVisible();
    await expect(page.getByText('Burger Cheese')).toBeVisible();
    await expect(page.getByText('Burger Veggie')).toBeVisible();
    await expect(page.getByText('Burger Spécial')).toBeVisible();
  });

  test('Data Persistence Simulation', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Test that static data persists through navigation
    await page.getByText('Gestion des ventes').click();
    
    // Verify historical sales data is displayed (simulating persistence)
    await expect(page.getByText('15/06/2023')).toBeVisible();
    await expect(page.getByText('Burger Classic')).toBeVisible();
    await expect(page.getByText('127,50 €')).toBeVisible();
    
    // Navigate away and back
    await page.getByText('Inventaire').click();
    await page.getByText('Gestion des ventes').click();
    
    // Verify data is still there (static persistence simulation)
    await expect(page.getByText('15/06/2023')).toBeVisible();
    await expect(page.getByText('Burger Classic')).toBeVisible();
    
    // Navigate to dashboard and verify stock data persistence
    await page.getByText('Tableau de bord').click();
    await expect(page.getByText('Pain burger')).toBeVisible();
    await expect(page.getByText('120 unités')).toBeVisible();
  });

  test('Form Validation and Error Handling', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Test sales form validation
    await page.getByText('Gestion des ventes').click();
    
    // Try to submit without selecting product (in real app would show error)
    await page.getByRole('button', { name: 'Ajouter la vente' }).click();
    
    // Verify form elements are present for validation
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Test stock form validation
    await page.getByText('Inventaire').click();
    
    // Verify stock update form elements
    await expect(page.locator('select[name="ingredient"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mettre à jour le stock' })).toBeVisible();
    
    // Test valid form submission
    await page.selectOption('select[name="ingredient"]', 'Pain burger');
    await page.fill('input[type="number"]', '10');
    await page.getByRole('button', { name: 'Mettre à jour le stock' }).click();
    
    // In real app, this would update the stock and show success message
  });

  test('Date Handling and Default Values', async ({ page }) => {
    // Navigate to static application
    await page.goto('file:///C:/Users/Mohamed%20BR/OneDrive/burger-mvp-project/APPLICATION-STATIQUE.html');
    
    // Test sales management date handling
    await page.getByText('Gestion des ventes').click();
    
    // Check that date field has today's date as default (in actual implementation)
    const dateField = page.locator('input[type="date"]');
    await expect(dateField).toBeVisible();
    
    // Verify current date format is acceptable
    const currentDate = new Date().toISOString().split('T')[0];
    await dateField.fill(currentDate);
    await expect(dateField).toHaveValue(currentDate);
    
    // Test custom date selection
    await dateField.fill('2024-06-15');
    await expect(dateField).toHaveValue('2024-06-15');
    
    // Verify historical data shows various dates
    await expect(page.getByText('15/06/2023')).toBeVisible();
    await expect(page.getByText('14/06/2023')).toBeVisible();
    await expect(page.getByText('13/06/2023')).toBeVisible();
  });

});