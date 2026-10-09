import React from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react';

const STOCK_ITEMS = [
  { id: 'MED-101', name: 'Paracetamol 500mg IV Infusion', category: 'Analgesics', stock: 450, unit: 'Vials', reorderLevel: 100, status: 'SUFFICIENT' },
  { id: 'MED-102', name: 'Amoxicillin + Clavulanate 1.2g', category: 'Antibiotics', stock: 120, unit: 'Vials', reorderLevel: 80, status: 'SUFFICIENT' },
  { id: 'MED-103', name: 'Normal Saline (0.9% NaCl 500ml)', category: 'IV Fluids', stock: 850, unit: 'Bags', reorderLevel: 200, status: 'SUFFICIENT' },
  { id: 'MED-104', name: 'Atorvastatin 20mg Tablets', category: 'Cardiovascular', stock: 35, unit: 'Strips', reorderLevel: 50, status: 'LOW_STOCK' },
  { id: 'MED-105', name: 'Sterile Surgical Gloves (Size 7.5)', category: 'Consumables', stock: 2400, unit: 'Pairs', reorderLevel: 500, status: 'SUFFICIENT' },
  { id: 'MED-106', name: 'Insulin Glargine 100 IU/ml', category: 'Endocrine', stock: 18, unit: 'Pens', reorderLevel: 25, status: 'LOW_STOCK' },
  { id: 'MED-107', name: 'Disposable Syringes 5ml with Needle', category: 'Consumables', stock: 4200, unit: 'Units', reorderLevel: 1000, status: 'SUFFICIENT' },
  { id: 'MED-108', name: 'Adrenaline (Epinephrine) 1mg/ml', category: 'Emergency Drugs', stock: 75, unit: 'Ampoules', reorderLevel: 30, status: 'SUFFICIENT' },
];

export const HospitalStockView: React.FC = () => {
  return (
    <div className="hospital-stock-view" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#003b73',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Pharmacy & Medical Supplies Stock
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, marginTop: '0.2rem' }}>
              Central medical inventory, dispensing counts, and critical stock threshold alerts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={15} /> 2 Items Low in Stock
          </span>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle, #f8fafc)', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Item Code & Name</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Available Quantity</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reorder Threshold</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Inventory Status</th>
            </tr>
          </thead>
          <tbody>
            {STOCK_ITEMS.map((item, idx) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: idx < STOCK_ITEMS.length - 1 ? '1px solid var(--border, #f1f5f9)' : 'none',
                }}
              >
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.id}</div>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>
                  {item.category}
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: item.status === 'LOW_STOCK' ? '#dc2626' : '#0f172a' }}>
                    {item.stock} {item.unit}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.88rem', color: '#64748b' }}>
                  {item.reorderLevel} {item.unit}
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: item.status === 'LOW_STOCK' ? '#fef2f2' : '#f0fdf4',
                      color: item.status === 'LOW_STOCK' ? '#dc2626' : '#16a34a',
                    }}
                  >
                    {item.status === 'LOW_STOCK' ? (
                      <>
                        <AlertTriangle size={13} /> Reorder Required
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> In Stock
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
