import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

class PDFExporterClass {
  static exportMenuReport(menuProduits: any[]) {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text('🍔 Burger Social Club - Rapport Menu', 20, 20);

    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);
    doc.text(`Nombre de produits: ${menuProduits.length}`, 20, 45);

    // Données du menu
    const tableData = menuProduits.map((produit, index) => [
      index + 1,
      produit.nom || 'N/A',
      produit.categorie || 'N/A',
      `${produit.prix_vente || 0}€`,
      produit.description || 'N/A'
    ]);

    doc.autoTable({
      head: [['#', 'Nom', 'Catégorie', 'Prix', 'Description']],
      body: tableData,
      startY: 60,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [3, 34, 76],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Pied de page
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('Burger Social Club - Système de gestion', 20, pageHeight - 20);

    // Sauvegarder le PDF
    doc.save(`menu_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static exportStockReport(stockData: any[]) {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text('📦 Burger Social Club - Rapport Stock', 20, 20);

    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);
    doc.text(`Nombre d'articles: ${stockData.length}`, 20, 45);

    // Statistiques
    const totalValue = stockData.reduce((sum, item) => sum + ((item.quantite || 0) * (item.prix || 0)), 0);
    const lowStockItems = stockData.filter(item => (item.quantite || 0) <= (item.seuil || 0)).length;

    doc.text(`Valeur totale du stock: ${totalValue.toFixed(2)}€`, 20, 55);
    doc.text(`Articles en rupture/alerte: ${lowStockItems}`, 20, 65);

    // Données du stock
    const tableData = stockData.map((item, index) => [
      index + 1,
      item.nom || item.name || 'N/A',
      item.quantite || item.quantity || 0,
      item.unite || 'pièce',
      `${item.prix || item.price || 0}€`,
      item.seuil || item.threshold || 0,
      item.fournisseur || 'N/A'
    ]);

    doc.autoTable({
      head: [['#', 'Nom', 'Quantité', 'Unité', 'Prix', 'Seuil', 'Fournisseur']],
      body: tableData,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [3, 34, 76],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 40 },
      },
    });

    // Alertes de stock
    const lowStockData = stockData
      .filter(item => (item.quantite || 0) <= (item.seuil || 0))
      .map((item, index) => [
        index + 1,
        item.nom || item.name || 'N/A',
        item.quantite || item.quantity || 0,
        item.seuil || item.threshold || 0
      ]);

    if (lowStockData.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('🚨 Alertes de Stock - Réapprovisionnement Requis', 20, 20);

      doc.autoTable({
        head: [['#', 'Produit', 'Stock Actuel', 'Seuil']],
        body: lowStockData,
        startY: 35,
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: 255,
          fontStyle: 'bold',
        },
      });
    }

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('Burger Social Club - Système de gestion', 20, pageHeight - 20);
      doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width - 40, pageHeight - 20);
    }

    // Sauvegarder le PDF
    doc.save(`stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static exportAnalyticsReport(data: any) {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text('📊 Burger Social Club - Rapport Analytics', 20, 20);

    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);

    // Contenu du rapport (adaptable selon les données)
    if (data && data.summary) {
      doc.text(`Période: ${data.summary.period || 'N/A'}`, 20, 50);
      doc.text(`Total Ventes: ${data.summary.totalSales || 0}€`, 20, 60);
      doc.text(`Produits Vendus: ${data.summary.totalProducts || 0}`, 20, 70);
    }

    // Pied de page
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('Burger Social Club - Analytics', 20, pageHeight - 20);

    doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}

export { PDFExporterClass as PDFExporter };