import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface BilanData {
  period: string;
  day?: string;
  revenue: number;
  total_charges: number;
  profit: number;
  transaction_count: number;
}

const AnnualAnalysis: React.FC = () => {
  const [view, setView] = useState<'years' | 'months' | 'days'>('years');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const [data, setData] = useState<BilanData[]>([]);
  const [loading, setLoading] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedDaysForComparison, setSelectedDaysForComparison] = useState<BilanData[]>([]);

  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    if (view === 'months') {
      fetchMonthsData();
    } else if (view === 'days' && selectedMonth) {
      fetchDaysData();
    }
  }, [view, selectedYear, selectedMonth]);

  // Auto-show comparison when 2 days are selected
  useEffect(() => {
    if (selectedDaysForComparison.length === 2) {
      setCompareMode(true);
    }
  }, [selectedDaysForComparison]);

  const fetchMonthsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const promises = Array.from({ length: 12 }, (_, i) => {
        return fetch(`http://localhost:8000/bilan-period?year=${selectedYear}&month=${i + 1}&period_type=month`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
      });

      const results = await Promise.all(promises);
      const flat = results.map((r, i) => r[0] || {
        period: `${selectedYear}-${(i + 1).toString().padStart(2, '0')}`,
        revenue: 0,
        profit: 0,
        total_charges: 0,
        transaction_count: 0
      });
      setData(flat);
    } catch (err) {
      console.error(err);
      toast.error("Erreur chargement données annuelles");
    } finally {
      setLoading(false);
    }
  };

  const fetchDaysData = async () => {
    if (!selectedMonth) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/bilan-period?year=${selectedYear}&month=${selectedMonth}&period_type=day`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dayData = await res.json();

      // Generate all days in the month
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const allDays: BilanData[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        // Find data for this day from backend
        const existingData = dayData.find((d: BilanData) => d.period === dateStr);

        if (existingData) {
          allDays.push(existingData);
        } else {
          // Create empty day with 0 values
          allDays.push({
            period: dateStr,
            revenue: 0,
            total_charges: 0,
            profit: 0,
            transaction_count: 0
          });
        }
      }

      setData(allDays);
    } catch (err) {
      console.error(err);
      toast.error("Erreur chargement données mensuelles");
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
    setView('months');
  };

  const handleMonthClick = (monthIndex: number) => {
    setSelectedMonth(monthIndex + 1);
    setView('days');
  };

  const handleBack = () => {
    if (view === 'days') setView('months');
    else if (view === 'months') setView('years');
    setCompareMode(false);
    setSelectedDaysForComparison([]);
  };

  const toggleDayComparison = (day: BilanData) => {
    if (selectedDaysForComparison.find(d => d.period === day.period)) {
      setSelectedDaysForComparison(prev => prev.filter(d => d.period !== day.period));
    } else {
      if (selectedDaysForComparison.length < 2) {
        setSelectedDaysForComparison(prev => [...prev, day]);
      } else {
        toast.info("Vous ne pouvez comparer que 2 jours maximum");
      }
    }
  };

  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalCharges = data.reduce((acc, curr) => acc + curr.total_charges, 0);
  const totalProfit = data.reduce((acc, curr) => acc + curr.profit, 0);
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          {view !== 'years' && (
            <button onClick={handleBack} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s ease'
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ⬅️
            </button>
          )}
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '900',
            color: 'white',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            📅 Analyse Annuelle
            {view === 'months' && <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              marginLeft: '1rem',
              fontSize: '2rem'
            }}> {selectedYear}</span>}
            {view === 'days' && <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              marginLeft: '1rem',
              fontSize: '2rem'
            }}> {months[(selectedMonth || 1) - 1]} {selectedYear}</span>}
          </h1>
        </div>

        {/* Top KPI Summary (for months and days view) */}
        {view !== 'years' && !loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <KpiBubble label="Revenu Total" value={`${totalRevenue.toFixed(0)} TND`} color="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" icon="💰" />
            <KpiBubble label="Total Charges" value={`${totalCharges.toFixed(0)} TND`} color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" icon="💸" />
            <KpiBubble label="Bénéfice Net" value={`${totalProfit.toFixed(0)} TND`} color="linear-gradient(135deg, #10b981 0%, #059669 100%)" icon="📈" />
            <KpiBubble label="Marge Globale" value={`${totalMargin.toFixed(1)}%`} color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" icon="📊" />
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid rgba(255,255,255,0.3)',
              borderTop: '6px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}

        {/* Year Selector (Dropdown) */}
        {!loading && view === 'years' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            padding: '3rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '2rem'
            }}>
              Sélectionnez une année
            </h2>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                padding: '1rem 2rem',
                borderRadius: '20px',
                border: '3px solid #667eea',
                background: 'white',
                color: '#1f2937',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
              }}>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {/* Months Grid */}
        {!loading && view === 'months' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {data.map((monthData, index) => (
              <div
                key={index}
                onClick={() => handleMonthClick(index)}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '25px',
                  padding: '2rem',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 50px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
                }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: monthData.profit >= 0 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '900',
                    color: '#1f2937',
                    textTransform: 'uppercase'
                  }}>
                    {months[index]}
                  </h3>
                  <span style={{
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    color: '#6b7280',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '800'
                  }}>
                    {monthData.transaction_count} cdes
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Revenu</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1f2937' }}>{monthData.revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Bénéfice</span>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '900',
                      color: monthData.profit >= 0 ? '#059669' : '#dc2626'
                    }}>
                      {monthData.profit.toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#f3f4f6',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${monthData.revenue > 0 ? Math.min((Math.abs(monthData.profit) / monthData.revenue) * 100, 100) : 0}%`,
                      background: monthData.profit >= 0 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                      transition: 'width 1s ease'
                    }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Days View with Comparison */}
        {!loading && view === 'days' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Comparison Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '25px',
              padding: '2rem',
              boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>⚖️</div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>Mode Comparaison</h3>
                  <p style={{ fontSize: '1rem', opacity: 0.9 }}>Sélectionnez 2 jours ({selectedDaysForComparison.length}/2)</p>
                </div>
              </div>
              {selectedDaysForComparison.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedDaysForComparison([]);
                    setCompareMode(false);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '15px',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'white';
                  }}>
                  RÉINITIALISER
                </button>
              )}
            </div>

            {/* Days Cards Grid */}
            {!compareMode && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {data.map((day) => {
                  const isSelected = selectedDaysForComparison.some(d => d.period === day.period);
                  return (
                    <div
                      key={day.period}
                      onClick={() => toggleDayComparison(day)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '25px',
                        padding: '2rem',
                        boxShadow: isSelected ? '0 12px 40px rgba(59, 130, 246, 0.4)' : '0 12px 40px rgba(0, 0, 0, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        border: isSelected ? '3px solid #3b82f6' : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(-8px)';
                          e.currentTarget.style.boxShadow = '0 16px 50px rgba(0, 0, 0, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
                        }
                      }}>
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)'
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '6px',
                        background: day.profit >= 0 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                        <h3 style={{
                          fontSize: '1.5rem',
                          fontWeight: '900',
                          color: isSelected ? '#1e40af' : '#1f2937'
                        }}>
                          {new Date(day.period).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </h3>
                        <span style={{
                          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          color: '#6b7280',
                          padding: '0.5rem 1rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '800'
                        }}>
                          {day.transaction_count} cdes
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Revenu</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1f2937' }}>{day.revenue.toFixed(0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Charges</span>
                          <span style={{ fontSize: '1rem', fontWeight: '800', color: '#dc2626' }}>-{day.total_charges.toFixed(0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Bénéfice</span>
                          <span style={{
                            fontSize: '1.5rem',
                            fontWeight: '900',
                            color: day.profit >= 0 ? '#059669' : '#dc2626'
                          }}>
                            {day.profit.toFixed(0)}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#f3f4f6',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          marginTop: '0.5rem'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${day.revenue > 0 ? Math.min((Math.abs(day.profit) / day.revenue) * 100, 100) : 0}%`,
                            background: day.profit >= 0 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                            transition: 'width 1s ease'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Comparison Modal */}
        {compareMode && selectedDaysForComparison.length === 2 && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
            onClick={() => setCompareMode(false)}>
            <div style={{
              background: 'white',
              borderRadius: '30px',
              padding: '3rem',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)'
            }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1f2937' }}>Duel de Performance</h2>
                <button
                  onClick={() => setCompareMode(false)}
                  style={{
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}>
                  FERMER
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '4rem' }}>
                  {['Date', 'Chiffre d\'Affaires', 'Total Charges', 'Bénéfice Net', 'Commandes', 'Taux de Marge'].map(label => (
                    <div key={label} style={{
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      color: '#6b7280',
                      textTransform: 'uppercase'
                    }}>
                      {label}
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '20px',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e40af', textAlign: 'center', marginBottom: '1rem' }}>PÉRIODE A</h3>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>{selectedDaysForComparison[0].period}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900' }}>{selectedDaysForComparison[0].revenue.toFixed(0)}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: '#dc2626' }}>{selectedDaysForComparison[0].total_charges.toFixed(0)}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{selectedDaysForComparison[0].profit.toFixed(0)}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>{selectedDaysForComparison[0].transaction_count}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '900', color: '#7c3aed' }}>
                    {selectedDaysForComparison[0].revenue > 0 ? ((selectedDaysForComparison[0].profit / selectedDaysForComparison[0].revenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                  borderRadius: '20px',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#c2410c', textAlign: 'center', marginBottom: '1rem' }}>PÉRIODE B</h3>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>{selectedDaysForComparison[1].period}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900' }}>{selectedDaysForComparison[1].revenue.toFixed(0)}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: '#dc2626' }}>{selectedDaysForComparison[1].total_charges.toFixed(0)}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{selectedDaysForComparison[1].profit.toFixed(0)}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>{selectedDaysForComparison[1].transaction_count}</div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '900', color: '#7c3aed' }}>
                    {selectedDaysForComparison[1].revenue > 0 ? ((selectedDaysForComparison[1].profit / selectedDaysForComparison[1].revenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                borderRadius: '20px',
                textAlign: 'center',
                color: 'white'
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.7 }}>Écart Brut de Revenu</p>
                <div style={{ fontSize: '3rem', fontWeight: '900' }}>
                  {Math.abs(selectedDaysForComparison[0].revenue - selectedDaysForComparison[1].revenue).toLocaleString()} <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>TND</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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

export default AnnualAnalysis;
