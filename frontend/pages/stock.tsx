import React from 'react';
import StockManagement from '../components/StockManagement';

const StockPage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-6">
      <StockManagement />
    </main>
  );
};

export default StockPage;