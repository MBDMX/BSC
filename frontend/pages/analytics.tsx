import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<{ orders: number; charges: number; profit: number; margin: number } | null>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      // Fetch KPIs
      const kpiRes = await fetch(`http://localhost:8000/bilan-period?year=${year}&month=${month}&period_type=month`, { headers });
      const kpiData = await kpiRes.json();

      if (kpiData && kpiData.length > 0) {
        const currentMonth = kpiData[0];
        const margin = currentMonth.revenue > 0 ? (currentMonth.profit / currentMonth.revenue) * 100 : 0;
        setKpis({
          orders: currentMonth.transaction_count,
          charges: currentMonth.total_charges,
          profit: currentMonth.profit,
          margin: margin
        });
      } else {
        setKpis({ orders: 0, charges: 0, profit: 0, margin: 0 });
      }

      // Fetch Dashboard Overview
      const overviewRes = await fetch(`http://localhost:8000/analytics/dashboard/overview?period=30j`, { headers });
      const overviewData = await overviewRes.json();

      if (overviewData) {
        setTopProducts(overviewData.raw_top_products || []);
        const history = (overviewData.raw_daily_sales || []).map((d: any) => ({
          ...d,
          formattedDate: new Date(d.date).toLocaleDateString()
        }));
        setSalesHistory(history);
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Erreur chargement analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '6px solid rgba(255,255,255,0.3)',
        borderTop: '6px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '2rem'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          color: 'white',
          marginBottom: '2rem',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          📊 Analytics
        </h1>

        {/* KPI Bubbles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <KpiBubble
            label="Commandes (Mois)"
            value={kpis?.orders.toString() || '0'}
            color="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
            icon="📦"
          />
          <KpiBubble
            label="Total Charges"
            value={`${kpis?.charges.toFixed(0)} TND`}
            color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            icon="💸"
          />
          <KpiBubble
            label="Bénéfice Net"
            value={`${kpis?.profit.toFixed(0)} TND`}
            color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            icon="💰"
          />
          <KpiBubble
            label="Marge Nette"
            value={`${kpis?.margin.toFixed(1)}%`}
            color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            icon="📈"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Sales Graph */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '1.5rem'
            }}>
              Évolution des Ventes (30 jours)
            </h2>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesHistory}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => str.split('-').slice(1).join('/')}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      background: 'white'
                    }}
                    formatter={(val: number) => [`${val.toFixed(2)} TND`, 'Revenu']}
                  />
                  <Area type="monotone" dataKey="montant" stroke="#667eea" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products with Peak Hours */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '1.5rem'
            }}>
              Top Produits (CA)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topProducts.map((product, index) => (
                <div key={product.id || index} style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  padding: '1.5rem',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'transform 0.2s ease',
                  cursor: 'default'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index < 3 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1f2937' }}>
                        {product.nom}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#059669' }}>
                        {product.chiffre_affaires?.toFixed(0)} TND
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '600' }}>
                        {product.quantite_vendue} ventes
                      </div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                    }}>
                      PIC: {product.peak_time || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiBubble = ({ label, value, color, icon }: { label: string, value: string, color: string, icon: string }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    padding: '2rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden'
  }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
    }}>
    <div style={{
      position: 'absolute',
      top: '-50%',
      right: '-50%',
      width: '200%',
      height: '200%',
      background: color,
      opacity: 0.05,
      borderRadius: '50%'
    }}></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
      <div style={{
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '800',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: '900',
          color: '#1f2937',
          lineHeight: '1'
        }}>
          {value}
        </div>
      </div>
    </div>
  </div>
);

export default Analytics;